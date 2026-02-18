#!/usr/bin/env python3
"""
Context Pruner - Reduce context size by removing less relevant content.

Key insight: Reducing context size reduces costs and can improve focus.
This script identifies and removes low-value content from context.

Usage:
    python context_pruner.py --file <path> --max-tokens <n> [--strategy <strategy>]

Strategies:
    - aggressive: Remove TODOs, comments, whitespace
    - conservative: Only remove whitespace and empty lines
    - smart: Keep relevant sections, remove boilerplate
"""

import argparse
import json
import re
import sys
from functools import lru_cache
from pathlib import Path
from typing import Dict, List, Tuple

# Approximate tokens per character (rough estimate)
TOKENS_PER_CHAR = 0.25


@lru_cache(maxsize=16)
def _compile_todo_pattern():
    """Cache compiled regex pattern for TODO/FIXME detection"""
    return re.compile(
        r"^\s*(#|//|/\*|\*)?\s*(TODO|FIXME|HACK|XXX|NOTE):", re.IGNORECASE
    )


@lru_cache(maxsize=32)
def _compile_boilerplate_patterns(language: str) -> List[re.Pattern]:
    """Cache compiled regex patterns for boilerplate removal"""
    if language == "python":
        patterns = [
            re.compile(r"^#!/.*$"),
            re.compile(r'^if __name__ == ["\']__main__["\']:'),
        ]
    elif language in ["javascript", "js"]:
        patterns = [
            re.compile(r'^"use strict";?\s*$'),
        ]
    else:
        patterns = []
    return patterns


@lru_cache(maxsize=32)
def _compile_important_patterns() -> List[re.Pattern]:
    """Cache compiled regex patterns for smart section keeping"""
    return [
        re.compile(r"^def\s+"),
        re.compile(r"^class\s+"),
        re.compile(r"^import\s+"),
        re.compile(r"^from\s+"),
        re.compile(r"^async\s+def"),
        re.compile(r"^\s*@"),
    ]


def estimate_tokens(text: str) -> int:
    """Estimate token count."""
    return int(len(text) * TOKENS_PER_CHAR)


def remove_whitespace(content: str) -> str:
    """Remove unnecessary whitespace."""
    lines = content.split("\n")

    # Remove empty lines at start/end
    while lines and not lines[0].strip():
        lines.pop(0)
    while lines and not lines[-1].strip():
        lines.pop()

    # Remove consecutive empty lines
    result = []
    prev_empty = False
    for line in lines:
        is_empty = not line.strip()
        if is_empty and prev_empty:
            continue
        result.append(line)
        prev_empty = is_empty

    return "\n".join(result)


def remove_comments(content: str, language: str = "python") -> str:
    """Remove comments based on language."""
    if language in ["python", "py"]:
        # Remove # comments but keep strings
        lines = content.split("\n")
        result_lines = []
        in_string = False
        string_char = None

        for line in lines:
            # Skip if inside string
            for i, char in enumerate(line):
                if char in ['"', "'"] and (i == 0 or line[i - 1] != "\\"):
                    if not in_string:
                        in_string = True
                        string_char = char
                    elif char == string_char:
                        in_string = False

            if not in_string:
                # Remove comment part
                comment_pos = line.find("#")
                if comment_pos > 0:
                    line = line[:comment_pos].rstrip()

            if line.strip():
                result_lines.append(line)

        return "\n".join(result_lines)

    elif language in ["javascript", "js", "typescript", "ts"]:
        # Remove // comments
        lines = content.split("\n")
        result_lines = []
        in_block_comment = False

        for line in lines:
            # Handle block comments
            if "/*" in line:
                in_block_comment = True
            if "*/" in line:
                in_block_comment = False
                continue

            if not in_block_comment:
                # Remove line comments
                comment_pos = line.find("//")
                if comment_pos >= 0:
                    line = line[:comment_pos]

                if line.strip():
                    result_lines.append(line)

        return "\n".join(result_lines)

    return content


def remove_todos(content: str) -> str:
    """Remove TODO/FIXME comments."""
    todo_pattern = _compile_todo_pattern()

    lines = content.split("\n")
    filtered = filter(lambda line: not todo_pattern.search(line), lines)

    return "\n".join(filtered)


def remove_boilerplate(content: str, language: str) -> str:
    """Remove common boilerplate patterns."""
    patterns = _compile_boilerplate_patterns(language)
    lines = content.split("\n")

    filtered = filter(
        lambda line: not any(re.match(pattern, line.strip()) for pattern in patterns),
        lines,
    )

    return "\n".join(filtered)


def smart_keep_sections(content: str, important_patterns: List[str]) -> str:
    """Keep only sections matching important patterns."""
    patterns = _compile_important_patterns()
    lines = content.split("\n")

    result = []
    include = True

    for line in lines:
        if any(re.match(pattern, line.strip(), re.IGNORECASE) for pattern in patterns):
            include = True

        if include or line.strip():
            result.append(line)

    return "\n".join(result)


def prune_context(
    content: str,
    max_tokens: int,
    strategy: str = "conservative",
    language: str = "python",
) -> Tuple[str, Dict]:
    """Prune context to fit within token limit."""

    original_tokens = estimate_tokens(content)
    original_lines = len(content.split("\n"))

    pruned = content

    if strategy == "aggressive":
        pruned = remove_whitespace(pruned)
        pruned = remove_comments(pruned, language)
        pruned = remove_todos(pruned)
        pruned = remove_boilerplate(pruned, language)

    elif strategy == "conservative":
        pruned = remove_whitespace(pruned)

    elif strategy == "smart":
        important_patterns = [
            r"^def\s+",
            r"^class\s+",
            r"^import\s+",
            r"^from\s+",
            r"^async\s+def",
            r"^\s*@",
        ]
        pruned = smart_keep_sections(pruned, important_patterns)
        pruned = remove_whitespace(pruned)

    final_tokens = estimate_tokens(pruned)

    if final_tokens > max_tokens:
        max_chars = int(max_tokens / TOKENS_PER_CHAR)
        pruned = pruned[:max_chars]

        last_newline = pruned.rfind("\n")
        if last_newline > max_chars * 0.8:
            pruned = pruned[:last_newline]

    final_tokens = estimate_tokens(pruned)
    final_lines = len(pruned.split("\n"))

    return pruned, {
        "original_tokens": original_tokens,
        "final_tokens": final_tokens,
        "tokens_removed": original_tokens - final_tokens,
        "reduction_percent": round(
            (original_tokens - final_tokens) / max(original_tokens, 1) * 100, 1
        ),
        "original_lines": original_lines,
        "final_lines": final_lines,
        "strategy": strategy,
    }


def find_context_files(base_dir: str = ".opencode/context-modules") -> List[str]:
    """Find context files that can be pruned."""
    path = Path(base_dir)
    if not path.exists():
        return []

    return [str(f) for f in path.glob("*.md")]


def main():
    parser = argparse.ArgumentParser(
        description="Context pruner for token optimization"
    )
    parser.add_argument("--file", help="File to prune")
    parser.add_argument("--dir", help="Directory to prune all files")
    parser.add_argument(
        "--max-tokens", type=int, default=4000, help="Max tokens (default: 4000)"
    )
    parser.add_argument(
        "--strategy",
        choices=["aggressive", "conservative", "smart"],
        default="conservative",
        help="Pruning strategy",
    )
    parser.add_argument(
        "--language", default="python", help="Language for comment removal"
    )
    parser.add_argument(
        "--dry-run", action="store_true", help="Show what would be pruned"
    )
    parser.add_argument("--json", action="store_true", help="Output JSON")

    args = parser.parse_args()

    files = []

    if args.file:
        files = [args.file]
    elif args.dir:
        files = find_context_files(args.dir)
    else:
        print("ERROR: Provide --file or --dir", file=sys.stderr)
        return 1

    results = []

    for file_path in files:
        path = Path(file_path)
        if not path.exists():
            continue

        content = path.read_text(encoding="utf-8")

        pruned, stats = prune_context(
            content, args.max_tokens, args.strategy, args.language
        )

        results.append({"file": file_path, "stats": stats})

        if not args.dry_run:
            path.write_text(pruned, encoding="utf-8")

        if args.json:
            print(json.dumps(results, indent=2))
        else:
            for result in results:
                stats = result["stats"]
                print(f"{result['file']}:")
                print(
                    f"  {stats['original_tokens']} -&gt; {stats['final_tokens']} tokens "
                    f"(-{stats['reduction_percent']}%)"
                )
                print(
                    f"  Lines: {stats['original_lines']} -&gt; {stats['final_lines']}"
                )

                if args.dry_run:
                    print("  [DRY RUN - no changes written]")
                else:
                    print("  [OK] Pruned")

    return 0


if __name__ == "__main__":
    sys.exit(main())
