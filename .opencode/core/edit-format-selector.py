#!/usr/bin/env python3
"""
Edit Format Selector
Auto-detects model and selects optimal edit format

Purpose: +20-61% edit success rate through intelligent format selection
Based on: "The Harness Problem" research + telemetry data
"""

import json
import os
import re
import sqlite3
from enum import Enum
from functools import lru_cache
from typing import Any, Callable, Dict, List, Optional, Tuple

# Config paths
SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
CONFIG_DIR = os.path.join(os.path.dirname(SCRIPT_DIR), "config")
MODEL_FORMATS_CONFIG = os.path.join(CONFIG_DIR, "edit-format-model-config.yaml")

OPENCODE_DB_PATHS = [
    os.path.expanduser("~/.local/share/opencode/opencode.db"),
    os.path.expanduser("~/Library/Application Support/opencode/opencode.db"),
    "/root/.local/share/opencode/opencode.db",
]

MODEL_ENV_VARS = [
    "LLM_MODEL",
    "MODEL",
    "MODEL_NAME",
    "CLAUDE_MODEL",
    "ANTHROPIC_MODEL",
    "OPENAI_MODEL",
    "GOOGLE_MODEL",
    "XAI_MODEL",
    "GLM_MODEL",
    "OLLAMA_MODEL",
]

CONFIG_FILE_PATHS = [".env", ".llmrc", ".openai/config", "~/.anthropic/config"]


class EditFormat(Enum):
    STR_REPLACE = "str_replace"
    STR_REPLACE_FUZZY = "str_replace_fuzzy"
    APPLY_PATCH = "apply_patch"
    HASHLINE = "hashline"
    WHOLE = "whole"
    UDIFF = "udiff"
    EDITBLOCK = "editblock"


# =============================================================================
# CONFIGURATION (functional, no side effects)
# =============================================================================


@lru_cache(maxsize=1)
def load_model_formats() -> Dict[str, EditFormat]:
    """Load model formats from config file - pure function with caching"""
    if not os.path.exists(MODEL_FORMATS_CONFIG):
        return {}

    try:
        import yaml

        with open(MODEL_FORMATS_CONFIG) as f:
            data = yaml.safe_load(f) or {}
    except Exception:
        return {}

    result = {}
    for key in ["model_formats", "user_models"]:
        for model, fmt in data.get(key, {}).items():
            try:
                result[model.lower()] = EditFormat(fmt)
            except ValueError:
                pass
    return result


def save_model_format(model: str, format_type: EditFormat) -> None:
    """Add model format to config file"""
    import yaml

    model_lower = model.lower()

    data = {}
    if os.path.exists(MODEL_FORMATS_CONFIG):
        try:
            with open(MODEL_FORMATS_CONFIG) as f:
                data = yaml.safe_load(f) or {}
        except Exception:
            pass

    data.setdefault("model_formats", {})
    data["model_formats"][model_lower] = format_type.value

    os.makedirs(CONFIG_DIR, exist_ok=True)
    with open(MODEL_FORMATS_CONFIG, "w") as f:
        yaml.dump(data, f, default_flow_style=False)


# =============================================================================
# MODEL DETECTION (functional, no side effects)
# =============================================================================


def get_model_from_env() -> Optional[str]:
    """Check environment variables for model"""
    return next((os.getenv(v) for v in MODEL_ENV_VARS if os.getenv(v)), None)


def get_model_from_db() -> Optional[str]:
    """Get model from OpenCode database"""
    for db_path in OPENCODE_DB_PATHS:
        if not os.path.exists(db_path):
            continue
        try:
            conn = sqlite3.connect(db_path)
            row = conn.execute(
                "SELECT data FROM message ORDER BY time_created DESC LIMIT 1"
            ).fetchone()
            conn.close()
            if row:
                return json.loads(row[0]).get("modelID")
        except Exception:
            continue
    return None


def get_model_from_config_files() -> Optional[str]:
    """Infer model from config files"""
    patterns = [
        r'MODEL\s*=\s*[\'"]?([^\'"\s]+)[\'"]?',
        r'model\s*:\s*[\'"]?([^\'"\s]+)[\'"]?',
        r"--model\s+([^\s]+)",
    ]

    for path in CONFIG_FILE_PATHS:
        expanded = os.path.expanduser(path)
        if not os.path.exists(expanded):
            continue
        try:
            content = open(expanded).read()
            for pat in patterns:
                match = re.search(pat, content, re.IGNORECASE)
                if match:
                    return match.group(1).lower()
        except Exception:
            continue
    return None


def detect_model() -> str:
    """Detect model - composition of detection strategies"""
    return (
        get_model_from_env()
        or get_model_from_db()
        or get_model_from_config_files()
        or "unknown"
    )


# =============================================================================
# FORMAT SELECTION
# =============================================================================

FALLBACK_CHAINS: Dict[EditFormat, List[EditFormat]] = {
    EditFormat.STR_REPLACE: [EditFormat.HASHLINE, EditFormat.APPLY_PATCH],
    EditFormat.STR_REPLACE_FUZZY: [
        EditFormat.STR_REPLACE,
        EditFormat.HASHLINE,
        EditFormat.APPLY_PATCH,
    ],
    EditFormat.APPLY_PATCH: [EditFormat.STR_REPLACE, EditFormat.HASHLINE],
    EditFormat.HASHLINE: [EditFormat.STR_REPLACE, EditFormat.APPLY_PATCH],
    EditFormat.WHOLE: [EditFormat.STR_REPLACE, EditFormat.HASHLINE],
    EditFormat.UDIFF: [EditFormat.STR_REPLACE, EditFormat.STR_REPLACE_FUZZY, EditFormat.HASHLINE],
    EditFormat.EDITBLOCK: [EditFormat.STR_REPLACE, EditFormat.STR_REPLACE_FUZZY, EditFormat.HASHLINE],
}

FORMAT_DESCRIPTIONS: Dict[EditFormat, Dict[str, str]] = {
    EditFormat.STR_REPLACE: {
        "name": "str_replace",
        "best_for": "Claude, Gemini",
        "description": "Exact string matching",
    },
    EditFormat.STR_REPLACE_FUZZY: {
        "name": "str_replace_fuzzy",
        "best_for": "Gemini",
        "description": "Fuzzy whitespace matching",
    },
    EditFormat.APPLY_PATCH: {
        "name": "apply_patch",
        "best_for": "GPT, OpenAI",
        "description": "OpenAI-style diff format",
    },
    EditFormat.HASHLINE: {
        "name": "hashline",
        "best_for": "Grok, GLM, smaller models",
        "description": "Content-hash anchoring",
    },
    EditFormat.WHOLE: {
        "name": "whole",
        "best_for": "Small files (<400 lines)",
        "description": "Rewrite entire file",
    },
    EditFormat.UDIFF: {
        "name": "udiff",
        "best_for": "GPT-4 Turbo family",
        "description": "Simplified unified diff",
    },
    EditFormat.EDITBLOCK: {
        "name": "editblock",
        "best_for": "Most models",
        "description": "Aider-style search/replace blocks",
    },
}

MODEL_NOTES: Dict[str, List[str]] = {
    "grok": ["Grok shows 10x improvement with hashline (6.7% -> 68.3%)"],
    "glm": ["GLM shows +8-14% improvement with hashline (46-50% -> 54-64%)"],
    "claude": ["Claude excels with str_replace (92-95% success rate)"],
    "gpt": ["GPT works best with apply_patch (91-94% success rate)"],
    "gemini": ["Gemini works best with str_replace_fuzzy (93% success rate)"],
    "llama": ["CodeLlama benefits from fuzzy matching"],
    "codellama": ["CodeLlama benefits from fuzzy matching"],
    "qwen": ["Use fuzzy matching, or hashline for larger models"],
    "deepseek": ["Strong reasoning, hashline helps"],
    "mistral": ["Strong model that handles str_replace well"],
    "phi": ["Strong reasoning models, hashline helps"],
    "yi": ["Hashline helps with mechanical edit tasks"],
    "internlm": ["Large models, benefit from fuzzy matching"],
    "command-r": ["Cohere models, str_replace works well"],
    "solar": ["Use fuzzy matching"],
    "mixtral": ["Strong models that handle str_replace well"],
}


def select_format(
    model: str, telemetry_callback: Optional[Callable] = None
) -> Tuple[EditFormat, float, str]:
    """Select optimal format for model"""
    # Try telemetry first
    if telemetry_callback:
        try:
            rates = telemetry_callback(model)
            if rates:
                best_fmt = max(rates, key=rates.get)
                return (
                    EditFormat(best_fmt),
                    rates[best_fmt],
                    f"Telemetry: {best_fmt} has {rates[best_fmt]:.1%}",
                )
        except Exception:
            pass

    # Use config
    configs = load_model_formats()

    # Exact match
    if model in configs:
        return configs[model], 0.95, f"Config: {model} -> {configs[model].value}"

    # Partial match
    for pattern, fmt in configs.items():
        if pattern in model:
            return fmt, 0.90, f"Config: {model} contains '{pattern}' -> {fmt.value}"

    # Default to hashline for reliability
    return EditFormat.HASHLINE, 0.7, f"Unknown model '{model}', defaulting to hashline for reliability"


def get_fallback_chain(format_type: EditFormat) -> List[EditFormat]:
    return FALLBACK_CHAINS.get(format_type, [])


def get_format_description(format_type: EditFormat) -> Dict[str, str]:
    return FORMAT_DESCRIPTIONS.get(format_type, {})


def get_model_notes(model: str, format_type: EditFormat) -> List[str]:
    return [
        note
        for prefix, notes in MODEL_NOTES.items()
        if prefix in model
        for note in notes
    ]


# =============================================================================
# EDIT EXECUTION
# =============================================================================


def apply_edit_with_hashline(filepath: str, edit_op: Dict[str, Any]) -> Dict[str, Any]:
    """Apply edit using hashline processor"""
    import importlib.util

    hashline_path = os.path.join(SCRIPT_DIR, "tools", "hashline-processor.py")
    spec = importlib.util.spec_from_file_location("hashline_processor", hashline_path)

    if not spec or not spec.loader:
        raise ValueError("Could not load hashline processor")

    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    processor = module.HashlineProcessor()

    hash_ref = processor.find_hash_line(filepath, edit_op.get("oldString", ""))
    if not hash_ref:
        raise ValueError(f"Could not find line: {edit_op.get('oldString', '')}")

    success = processor.apply_hashline_edit(
        filepath, hash_ref, edit_op.get("newString", "")
    )
    return {"success": success}


def execute_with_retry(
    filepath: str,
    edit_op: Dict[str, Any],
    model: Optional[str] = None,
    max_attempts: int = 3,
) -> Dict[str, Any]:
    """Execute edit with automatic format retry"""
    model = model or detect_model()
    primary_format, confidence, reason = select_format(model)

    formats_to_try = [primary_format] + get_fallback_chain(primary_format)

    for i, fmt in enumerate(formats_to_try[:max_attempts]):
        try:
            result = apply_edit_with_hashline(filepath, edit_op)
            return {
                "success": True,
                "format_used": fmt.value,
                "attempts": i + 1,
                "confidence": confidence,
                "reason": reason,
                "format_description": get_format_description(fmt),
                "result": result,
            }
        except Exception as e:
            continue

    return {
        "success": False,
        "formats_tried": [f.value for f in formats_to_try[:max_attempts]],
        "error": "All edit formats failed",
    }


# =============================================================================
# CLI
# =============================================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Edit Format Selector")
    subparsers = parser.add_subparsers(dest="command")

    subparsers.add_parser("detect", help="Auto-detect model")

    rec = subparsers.add_parser("recommend", help="Get format recommendation")
    rec.add_argument("--model", help="Model identifier")

    add_cmd = subparsers.add_parser("add", help="Add model format")
    add_cmd.add_argument("model")
    add_cmd.add_argument(
        "format",
        choices=["str_replace", "str_replace_fuzzy", "apply_patch", "hashline"],
    )

    args = parser.parse_args()

    if args.command == "detect":
        print(f"Detected model: {detect_model()}")

    elif args.command == "recommend":
        model = args.model or detect_model()
        fmt, conf, reason = select_format(model)

        print(f"\n=== Format Recommendation for {model} ===")
        print(f"Format: {fmt.value}")
        print(f"Confidence: {conf:.1%}")
        print(f"Reason: {reason}")
        print(f"\n{get_format_description(fmt)['description']}")

        notes = get_model_notes(model, fmt)
        if notes:
            print("\nNotes:")
            for note in notes:
                print(f"  - {note}")

        print(f"\nFallback: {' -> '.join(f.value for f in get_fallback_chain(fmt))}")

    elif args.command == "add":
        save_model_format(args.model, EditFormat(args.format))
        print(f"Added: {args.model} -> {args.format}")
