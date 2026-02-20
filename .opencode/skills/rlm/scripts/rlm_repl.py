#!/usr/bin/env python3
"""Persistent mini-REPL for RLM-style workflows in Claude Code.

This script provides a *stateful* Python environment across invocations by
saving a pickle file to disk. It is intentionally small and dependency-free.

Typical flow:
  1) Initialise context:
       python rlm_repl.py init path/to/context.txt
  2) Execute code repeatedly (state persists):
       python rlm_repl.py exec -c 'print(len(content))'
       python rlm_repl.py exec <<'PYCODE'
       # you can write multi-line code
       hits = grep('TODO')
       print(hits[:3])
       PYCODE

The script injects these variables into the exec environment:
  - context: dict with keys {path, loaded_at, content}
  - content: string alias for context['content']
  - buffers: list[str] for storing intermediate text results

It also injects helpers:
  - peek(start=0, end=1000) -> str
  - grep(pattern, max_matches=20, window=120, flags=0) -> list[dict]
  - chunk_indices(size=200000, overlap=0) -> list[(start,end)]
  - write_chunks(out_dir, size=200000, overlap=0, prefix='chunk') -> list[str]
  - add_buffer(text: str) -> None
  - sub_llm(prompt, chunk=None, agent='rlm-subcall') -> dict  # RLM integration

Security note:
  This runs arbitrary Python via exec. Treat it like running code you wrote.

REMOVAL:
  See REMOVAL.md in the parent directory for complete removal checklist.
  This skill can be removed when opencode adds native RLM support.
"""

from __future__ import annotations

import argparse
import io
import json
import os
import pickle
import re
import subprocess
import sys
import textwrap
import time
import traceback
from contextlib import redirect_stderr, redirect_stdout
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Import parallel and adaptive processing (Phase 1.3 and 2.1)
try:
    from ..adaptive_chunker import AdaptiveChunker, get_adaptive_chunker
    from ..parallel_processor import ParallelWaveProcessor, get_parallel_processor

    PARALLEL_AVAILABLE = True
except ImportError:
    PARALLEL_AVAILABLE = False

DEFAULT_STATE_PATH = Path(".opencode/rlm_state/state.pkl")
DEFAULT_MAX_OUTPUT_CHARS = 8000

# ============================================================================
# RLM INTEGRATION CONFIGURATION
# ============================================================================
# These settings control how sub_llm() connects to opencode.
# Set OPENCODE_RLM_DISABLED=1 to disable sub_llm (for testing/standalone mode).
# Set OPENCODE_RLM_CLI_PATH to override the opencode CLI path.
RLM_CONFIG = {
    "disabled": os.environ.get("OPENCODE_RLM_DISABLED", "0") == "1",
    "cli_path": os.environ.get("OPENCODE_RLM_CLI_PATH", "opencode"),
    "default_agent": os.environ.get("OPENCODE_RLM_AGENT", "rlm-subcall"),
    "timeout_seconds": int(os.environ.get("OPENCODE_RLM_TIMEOUT", "120")),
}


class RlmReplError(RuntimeError):
    pass


def _ensure_parent_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def _load_state(state_path: Path) -> Dict[str, Any]:
    if not state_path.exists():
        raise RlmReplError(
            f"No state found at {state_path}. Run: python rlm_repl.py init <context_path>"
        )
    with state_path.open("rb") as f:
        state = pickle.load(f)
    if not isinstance(state, dict):
        raise RlmReplError(f"Corrupt state file: {state_path}")
    return state


def _save_state(state: Dict[str, Any], state_path: Path) -> None:
    _ensure_parent_dir(state_path)
    tmp_path = state_path.with_suffix(state_path.suffix + ".tmp")
    with tmp_path.open("wb") as f:
        pickle.dump(state, f, protocol=pickle.HIGHEST_PROTOCOL)
    tmp_path.replace(state_path)


def _read_text_file(path: Path, max_bytes: int | None = None) -> str:
    if not path.exists():
        raise RlmReplError(f"Context file does not exist: {path}")
    data: bytes
    with path.open("rb") as f:
        data = f.read() if max_bytes is None else f.read(max_bytes)
    try:
        return data.decode("utf-8")
    except UnicodeDecodeError:
        # Fall back to a lossy decode that will not crash.
        return data.decode("utf-8", errors="replace")


def _truncate(s: str, max_chars: int) -> str:
    if max_chars <= 0:
        return ""
    if len(s) <= max_chars:
        return s
    return s[:max_chars] + f"\n... [truncated to {max_chars} chars] ...\n"


def _is_pickleable(value: Any) -> bool:
    try:
        pickle.dumps(value, protocol=pickle.HIGHEST_PROTOCOL)
        return True
    except Exception:
        return False


def _filter_pickleable(d: Dict[str, Any]) -> Tuple[Dict[str, Any], List[str]]:
    kept: Dict[str, Any] = {}
    dropped: List[str] = []
    for k, v in d.items():
        if _is_pickleable(v):
            kept[k] = v
        else:
            dropped.append(k)
    return kept, dropped


def _make_helpers(context_ref: Dict[str, Any], buffers_ref: List[str]):
    # These close over context_ref/buffers_ref so changes persist.
    def peek(start: int = 0, end: int = 1000) -> str:
        content = context_ref.get("content", "")
        return content[start:end]

    def grep(
        pattern: str,
        max_matches: int = 20,
        window: int = 120,
        flags: int = 0,
    ) -> List[Dict[str, Any]]:
        content = context_ref.get("content", "")
        out: List[Dict[str, Any]] = []
        for m in re.finditer(pattern, content, flags):
            start, end = m.span()
            snippet_start = max(0, start - window)
            snippet_end = min(len(content), end + window)
            out.append(
                {
                    "match": m.group(0),
                    "span": (start, end),
                    "snippet": content[snippet_start:snippet_end],
                }
            )
            if len(out) >= max_matches:
                break
        return out

    def chunk_indices(size: int = 200_000, overlap: int = 0) -> List[Tuple[int, int]]:
        if size <= 0:
            raise ValueError("size must be > 0")
        if overlap < 0:
            raise ValueError("overlap must be >= 0")
        if overlap >= size:
            raise ValueError("overlap must be < size")

        content = context_ref.get("content", "")
        n = len(content)
        spans: List[Tuple[int, int]] = []
        step = size - overlap
        for start in range(0, n, step):
            end = min(n, start + size)
            spans.append((start, end))
            if end >= n:
                break
        return spans

    def write_chunks(
        out_dir: str | os.PathLike,
        size: int = 200_000,
        overlap: int = 0,
        prefix: str = "chunk",
        encoding: str = "utf-8",
    ) -> List[str]:
        content = context_ref.get("content", "")
        spans = chunk_indices(size=size, overlap=overlap)
        out_path = Path(out_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        paths: List[str] = []
        for i, (s, e) in enumerate(spans):
            p = out_path / f"{prefix}_{i:04d}.txt"
            p.write_text(content[s:e], encoding=encoding)
            paths.append(str(p))
        return paths

    def add_buffer(text: str) -> None:
        buffers_ref.append(str(text))

    # ========================================================================
    # RLM INTEGRATION: sub_llm()
    # ========================================================================
    # This function enables true RLM-style recursion by allowing the REPL
    # to call back to opencode's task tool (subagent delegation).
    #
    # Usage:
    #   result = sub_llm("Find all API endpoints in this chunk", chunk=chunk_text)
    #   result = sub_llm("Analyze this file", chunk_file="/path/to/chunk.txt")
    #
    # The result is a dict with:
    #   - success: bool
    #   - result: dict (the subagent's output)
    #   - error: str (if failed)
    # ========================================================================
    def sub_llm(
        prompt: str,
        chunk: Optional[str] = None,
        chunk_file: Optional[str] = None,
        agent: Optional[str] = None,
        description: Optional[str] = None,
    ) -> Dict[str, Any]:
        """
        Call a subagent (RLM sub-LLM) to process a chunk or query.

        This enables true RLM-style recursion where the REPL can invoke
        subagents programmatically, just like the MIT paper's sub_LLM().

        Args:
            prompt: The query/question for the subagent
            chunk: Raw text chunk to analyze (optional)
            chunk_file: Path to chunk file (optional, takes precedence over chunk)
            agent: Subagent type (default: rlm-subcall)
            description: Short description for the task

        Returns:
            dict with keys:
                - success: bool
                - result: dict (the subagent's structured output)
                - error: str (if failed)
                - chunk_id: str (identifier for this chunk)

        Example:
            # Process chunks in a loop (true RLM pattern)
            chunks = chunk_indices(size=50000)
            results = []
            for start, end in chunks[:10]:
                chunk_text = peek(start, end)
                result = sub_llm("Find errors", chunk=chunk_text)
                if result["success"]:
                    results.append(result["result"])
            Final = synthesize(results)
        """
        if RLM_CONFIG["disabled"]:
            return {
                "success": False,
                "error": "RLM integration disabled (OPENCODE_RLM_DISABLED=1)",
                "chunk_id": None,
            }

        agent = agent or RLM_CONFIG["default_agent"]
        description = description or f"RLM chunk analysis"

        # Build the full prompt
        full_prompt = prompt
        if chunk_file:
            full_prompt = f"{prompt}\n\nChunk file: {chunk_file}"
        elif chunk:
            # Write chunk to temp file for subagent to read
            chunk_dir = Path(".opencode/rlm_state/chunks")
            chunk_dir.mkdir(parents=True, exist_ok=True)
            chunk_id = f"chunk_{time.time_ns()}"
            chunk_path = chunk_dir / f"{chunk_id}.txt"
            chunk_path.write_text(chunk, encoding="utf-8")
            full_prompt = f"{prompt}\n\nChunk file: {chunk_path}"
        else:
            # No chunk provided, just use the prompt
            pass

        try:
            # Call opencode CLI with task subagent
            # This is the bridge between Python REPL and opencode's task tool
            # The CLI path can be overridden with OPENCODE_RLM_CLI_PATH env var
            result = subprocess.run(
                [
                    RLM_CONFIG["cli_path"],
                    "task",
                    "--agent",
                    agent,
                    "--description",
                    description,
                    "--prompt",
                    full_prompt,
                ],
                capture_output=True,
                text=True,
                timeout=RLM_CONFIG["timeout_seconds"],
            )

            if result.returncode != 0:
                return {
                    "success": False,
                    "error": f"CLI error: {result.stderr}",
                    "chunk_id": chunk_file or "inline",
                }

            # Parse the output
            output = result.stdout.strip()

            # Try to extract JSON from the output
            # The subagent returns structured JSON
            try:
                # Look for JSON in the output
                json_start = output.find("{")
                json_end = output.rfind("}") + 1
                if json_start != -1 and json_end > json_start:
                    json_str = output[json_start:json_end]
                    parsed = json.loads(json_str)
                    return {
                        "success": True,
                        "result": parsed,
                        "raw_output": output,
                        "chunk_id": chunk_file or "inline",
                    }
            except json.JSONDecodeError:
                pass

            # Return raw output if no JSON found
            return {
                "success": True,
                "result": {"text": output},
                "raw_output": output,
                "chunk_id": chunk_file or "inline",
            }

        except subprocess.TimeoutExpired:
            return {
                "success": False,
                "error": f"Timeout after {RLM_CONFIG['timeout_seconds']}s",
                "chunk_id": chunk_file or "inline",
            }
        except FileNotFoundError:
            return {
                "success": False,
                "error": f"opencode CLI not found at: {RLM_CONFIG['cli_path']}",
                "chunk_id": chunk_file or "inline",
                "hint": "Set OPENCODE_RLM_CLI_PATH environment variable",
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e),
                "chunk_id": chunk_file or "inline",
            }

    return {
        "peek": peek,
        "grep": grep,
        "chunk_indices": chunk_indices,
        "write_chunks": write_chunks,
        "add_buffer": add_buffer,
        "sub_llm": sub_llm,
    }


def cmd_init(args: argparse.Namespace) -> int:
    state_path = Path(args.state)
    ctx_path = Path(args.context)

    content = _read_text_file(ctx_path, max_bytes=args.max_bytes)
    state: Dict[str, Any] = {
        "version": 1,
        "context": {
            "path": str(ctx_path),
            "loaded_at": time.time(),
            "content": content,
        },
        "buffers": [],
        "globals": {},
    }
    _save_state(state, state_path)

    print(f"Initialised RLM REPL state at: {state_path}")
    print(f"Loaded context: {ctx_path} ({len(content):,} chars)")
    return 0


def cmd_status(args: argparse.Namespace) -> int:
    state = _load_state(Path(args.state))
    ctx = state.get("context", {})
    content = ctx.get("content", "")
    buffers = state.get("buffers", [])
    g = state.get("globals", {})

    print("RLM REPL status")
    print(f"  State file: {args.state}")
    print(f"  Context path: {ctx.get('path')}")
    print(f"  Context chars: {len(content):,}")
    print(f"  Buffers: {len(buffers)}")
    print(f"  Persisted vars: {len(g)}")
    if args.show_vars and g:
        for k in sorted(g.keys()):
            print(f"    - {k}")
    return 0


def cmd_reset(args: argparse.Namespace) -> int:
    state_path = Path(args.state)
    if state_path.exists():
        state_path.unlink()
        print(f"Deleted state: {state_path}")
    else:
        print(f"No state to delete at: {state_path}")
    return 0


def cmd_export_buffers(args: argparse.Namespace) -> int:
    state = _load_state(Path(args.state))
    buffers = state.get("buffers", [])
    out_path = Path(args.out)
    _ensure_parent_dir(out_path)
    out_path.write_text("\n\n".join(str(b) for b in buffers), encoding="utf-8")
    print(f"Wrote {len(buffers)} buffers to: {out_path}")
    return 0


def cmd_exec(args: argparse.Namespace) -> int:
    state_path = Path(args.state)
    state = _load_state(state_path)

    ctx = state.get("context")
    if not isinstance(ctx, dict) or "content" not in ctx:
        raise RlmReplError("State is missing a valid 'context'. Re-run init.")

    buffers = state.setdefault("buffers", [])
    if not isinstance(buffers, list):
        buffers = []
        state["buffers"] = buffers

    persisted = state.setdefault("globals", {})
    if not isinstance(persisted, dict):
        persisted = {}
        state["globals"] = persisted

    code = args.code
    if code is None:
        code = sys.stdin.read()

    # Build execution environment.
    # Start from persisted variables, then inject context, buffers and helpers.
    env: Dict[str, Any] = dict(persisted)
    env["context"] = ctx
    env["content"] = ctx.get("content", "")
    env["buffers"] = buffers

    helpers = _make_helpers(ctx, buffers)
    env.update(helpers)

    # Capture output.
    stdout_buf = io.StringIO()
    stderr_buf = io.StringIO()

    try:
        with redirect_stdout(stdout_buf), redirect_stderr(stderr_buf):
            exec(code, env, env)
    except Exception:
        traceback.print_exc(file=stderr_buf)

    # Pull back possibly mutated context/buffers.
    maybe_ctx = env.get("context")
    if isinstance(maybe_ctx, dict) and "content" in maybe_ctx:
        state["context"] = maybe_ctx
        ctx = maybe_ctx

    maybe_buffers = env.get("buffers")
    if isinstance(maybe_buffers, list):
        state["buffers"] = maybe_buffers
        buffers = maybe_buffers

    # Persist any new variables, excluding injected keys.
    injected_keys = {
        "__builtins__",
        "context",
        "content",
        "buffers",
        *helpers.keys(),
    }
    to_persist = {k: v for k, v in env.items() if k not in injected_keys}
    filtered, dropped = _filter_pickleable(to_persist)
    state["globals"] = filtered

    _save_state(state, state_path)

    out = stdout_buf.getvalue()
    err = stderr_buf.getvalue()

    if dropped and args.warn_unpickleable:
        msg = "Dropped unpickleable variables: " + ", ".join(dropped)
        err = err + ("\n" if err else "") + msg + "\n"

    if out:
        sys.stdout.write(_truncate(out, args.max_output_chars))

    if err:
        sys.stderr.write(_truncate(err, args.max_output_chars))

    return 0


def build_parser() -> argparse.ArgumentParser:
    p = argparse.ArgumentParser(
        prog="rlm_repl",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        description=textwrap.dedent(
            """\
            Persistent mini-REPL for RLM-style workflows.

            Examples:
              python rlm_repl.py init context.txt
              python rlm_repl.py status
              python rlm_repl.py exec -c "print(len(content))"
              python rlm_repl.py exec <<'PY'
              print(peek(0, 2000))
              PY
            """
        ),
    )
    p.add_argument(
        "--state",
        default=str(DEFAULT_STATE_PATH),
        help=f"Path to state pickle (default: {DEFAULT_STATE_PATH})",
    )

    sub = p.add_subparsers(dest="cmd", required=True)

    p_init = sub.add_parser("init", help="Initialise state from a context file")
    p_init.add_argument("context", help="Path to the context file")
    p_init.add_argument(
        "--max-bytes",
        type=int,
        default=None,
        help="Optional cap on bytes read from the context file",
    )
    p_init.set_defaults(func=cmd_init)

    p_status = sub.add_parser("status", help="Show current state summary")
    p_status.add_argument(
        "--show-vars", action="store_true", help="List persisted variable names"
    )
    p_status.set_defaults(func=cmd_status)

    p_reset = sub.add_parser("reset", help="Delete the current state file")
    p_reset.set_defaults(func=cmd_reset)

    p_export = sub.add_parser(
        "export-buffers", help="Export buffers list to a text file"
    )
    p_export.add_argument("out", help="Output file path")
    p_export.set_defaults(func=cmd_export_buffers)

    p_exec = sub.add_parser("exec", help="Execute Python code with persisted state")
    p_exec.add_argument(
        "-c",
        "--code",
        default=None,
        help="Inline code string. If omitted, reads code from stdin.",
    )
    p_exec.add_argument(
        "--max-output-chars",
        type=int,
        default=DEFAULT_MAX_OUTPUT_CHARS,
        help=f"Truncate stdout/stderr to this many characters (default: {DEFAULT_MAX_OUTPUT_CHARS})",
    )
    p_exec.add_argument(
        "--warn-unpickleable",
        action="store_true",
        help="Warn on stderr when variables could not be persisted",
    )
    p_exec.set_defaults(func=cmd_exec)

    return p


# === PARALLEL PROCESSING HELPERS (Phase 1.3) ===


def process_chunks_parallel(
    chunks: List[str], query: str, subagent_callback: callable
) -> Dict[str, Any]:
    """Process chunks in parallel waves (Phase 1.3 implementation)

    Args:
        chunks: List of chunk file paths
        query: Query/question for processing
        subagent_callback: Function to call for each chunk

    Returns:
        Processing results dictionary
    """
    if not PARALLEL_AVAILABLE:
        print("WARNING: parallel_processor not available, falling back to sequential")
        return process_chunks_sequential(chunks, query, subagent_callback)

    processor = get_parallel_processor(max_concurrent=5)
    return processor.process_all_chunks(
        chunk_paths=chunks, query=query, callback=subagent_callback
    )


def process_chunks_sequential(
    chunks: List[str], query: str, subagent_callback: callable
) -> Dict[str, Any]:
    """Process chunks sequentially (fallback when parallel unavailable)

    Args:
        chunks: List of chunk file paths
        query: Query/question for processing
        subagent_callback: Function to call for each chunk

    Returns:
        Processing results dictionary
    """
    results = []
    for chunk_path in chunks:
        try:
            result = subagent_callback({"chunk_file": chunk_path, "query": query})
            results.append(
                {"chunk_id": Path(chunk_path).stem, "success": True, "result": result}
            )
        except Exception as e:
            results.append(
                {"chunk_id": Path(chunk_path).stem, "success": False, "error": str(e)}
            )

    return {
        "total_chunks": len(chunks),
        "processed_chunks": len(results),
        "results": results,
    }


# === ADAPTIVE CHUNKING HELPERS (Phase 2.1) ===


def create_chunks_adaptive(
    content: str, max_chunks: int = None, output_dir: str = None
) -> List[str]:
    """Create chunks using semantic boundary detection (Phase 2.1 implementation)

    Args:
        content: Content to chunk
        max_chunks: Maximum number of chunks
        output_dir: Output directory for chunk files

    Returns:
        List of chunk file paths
    """
    if not PARALLEL_AVAILABLE:
        print("WARNING: adaptive_chunker not available, falling back to fixed-size")
        return write_chunks(output_dir, size=200000, overlap=0)

    chunker = get_adaptive_chunker()
    return chunker.create_chunks_file(
        content=content, output_dir=output_dir, max_chunks=max_chunks
    )


def update_chunking_performance(processing_time_ms: int):
    """Update chunk size based on performance (Phase 2.1 implementation)

    Args:
        processing_time_ms: Time taken to process chunks
    """
    if not PARALLEL_AVAILABLE:
        print("WARNING: adaptive_chunker not available, skipping performance update")
        return

    chunker = get_adaptive_chunker()
    chunker.adjust_chunk_size(processing_time_ms)


def get_chunking_stats() -> Dict[str, Any]:
    """Get current chunking statistics (Phase 2.1 implementation)

    Returns:
        Dictionary with chunking statistics
    """
    if not PARALLEL_AVAILABLE:
        return {"error": "adaptive_chunker not available"}

    chunker = get_adaptive_chunker()
    return chunker.get_stats()


def main(argv: List[str]) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)

    try:
        return int(args.func(args))
    except RlmReplError as e:
        sys.stderr.write(f"ERROR: {e}\n")
        return 2


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
