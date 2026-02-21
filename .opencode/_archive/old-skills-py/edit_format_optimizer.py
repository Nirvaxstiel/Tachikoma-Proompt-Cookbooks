#!/usr/bin/env python3
"""
Edit Format Optimizer - Try multiple edit formats and return the first that works.

Key insight: Different models succeed with different edit formats.
This script tries multiple formats to maximize success rate.

Usage:
    python edit_format_optimizer.py --file <path> --old <old_string> --new <new_string> [--model <model_name>]
"""

import argparse
import difflib
import hashlib
import re
import sys
from pathlib import Path
from typing import Optional, Tuple


def normalize_whitespace(s: str) -> str:
    """Normalize whitespace for fuzzy matching."""
    return re.sub(r"\s+", " ", s.strip())


def try_str_replace_exact(content: str, old: str, new: str) -> Tuple[bool, str, str]:
    """Try exact string replacement."""
    if old in content:
        new_content = content.replace(old, new, 1)
        return True, new_content, "str_replace_exact"
    return False, content, "str_replace_exact"


def try_str_replace_fuzzy(content: str, old: str, new: str) -> Tuple[bool, str, str]:
    """Try fuzzy whitespace-tolerant replacement."""
    old_normalized = normalize_whitespace(old)
    lines = content.split("\n")

    for i, line in enumerate(lines):
        if normalize_whitespace(line) == old_normalized:
            lines[i] = new
            new_content = "\n".join(lines)
            return True, new_content, "str_replace_fuzzy"

    return False, content, "str_replace_fuzzy"


def try_apply_patch(content: str, old: str, new: str) -> Tuple[bool, str, str]:
    """Try OpenAI-style patch format."""
    patch = f"""<<<<<<<
{old}
=======
{new}
>>>>>>>"""

    old_lines = old.split("\n")
    content_lines = content.split("\n")

    # Find the old section in content
    matcher = difflib.SequenceMatcher(None, content_lines, old_lines)
    matches = list(matcher.get_matching_blocks())

    if matches and matches[0].size > len(old_lines) * 0.5:
        # Found a reasonable match
        start = matches[0].b
        end = start + matches[0].size

        new_lines = content_lines[:start] + new.split("\n") + content_lines[end:]
        new_content = "\n".join(new_lines)
        return True, new_content, "apply_patch"

    return False, content, "apply_patch"


def try_line_number_edit(
    content: str, old: str, new: str, line_num: Optional[int] = None
) -> Tuple[bool, str, str]:
    """Try editing by line number if provided."""
    if line_num is None:
        return False, content, "line_number"

    lines = content.split("\n")
    if 0 < line_num <= len(lines):
        # Replace that specific line
        lines[line_num - 1] = new
        new_content = "\n".join(lines)
        return True, new_content, f"line_number:{line_num}"

    return False, content, "line_number"


def try_regex_replace(content: str, old: str, new: str) -> Tuple[bool, str, str]:
    """Try regex-based replacement."""
    try:
        if re.search(old, content):
            new_content = re.sub(old, new, content, count=1)
            return True, new_content, "regex_replace"
    except re.error:
        pass
    return False, content, "regex_replace"


def generate_hashline_content(content: str) -> str:
    """Generate hashline-tagged content (for hashline format)."""
    lines = content.split("\n")
    result = []

    for i, line in enumerate(lines, 1):
        # Generate short hash of line content
        line_hash = hashlib.md5(line.encode()).hexdigest()[:2]
        result.append(f"{i:02d}:{line_hash}|{line}")

    return "\n".join(result)


def try_hashline_edit(content: str, old: str, new: str) -> Tuple[bool, str, str]:
    """Try hashline-based edit if content was read with hashlines."""
    # Check if content has hashline format
    hashline_pattern = r"^\d+:[a-f0-9]{2}\|"

    if not re.match(hashline_pattern, content.split("\n")[0] if content else ""):
        # Not hashline format, can't use this
        return False, content, "hashline_not_available"

    # Extract old content hashes and try to match
    old_lines = old.split("\n")
    content_lines = content.split("\n")

    # Parse hashlines
    parsed = []
    for line in content_lines:
        match = re.match(r"^(\d+):([a-f0-9]{2})\|(.*)$", line)
        if match:
            parsed.append((match.group(1), match.group(2), match.group(3)))

    # Find matching sequence
    for i in range(len(parsed) - len(old_lines) + 1):
        match = True
        for j, old_line in enumerate(old_lines):
            if parsed[i + j][2] != old_line:
                match = False
                break

        if match:
            # Found match, construct new content
            new_lines = content_lines[:i]
            new_lines.extend(new.split("\n"))
            new_lines.extend(content_lines[i + len(old_lines) :])
            new_content = "\n".join(new_lines)
            return True, new_content, "hashline"

    return False, content, "hashline"


def optimize_edit(
    file_path: str,
    old: str,
    new: str,
    model: str = "auto",
    line_num: Optional[int] = None,
) -> Tuple[str, str, bool]:
    """
    Try multiple edit formats, return first successful one.

    Returns: (new_content, format_used, success)
    """
    # Read file
    path = Path(file_path)
    if not path.exists():
        print(f"ERROR: File not found: {file_path}", file=sys.stderr)
        return "", "", False

    content = path.read_text(encoding="utf-8")

    # Determine model family
    model_lower = model.lower() if model != "auto" else "auto"

    # Order of strategies based on model
    strategies = []

    if model_lower == "auto":
        # Try in order of general success rate
        strategies = [
            lambda: try_str_replace_exact(content, old, new),
            lambda: try_str_replace_fuzzy(content, old, new),
            lambda: try_regex_replace(content, old, new),
            lambda: try_apply_patch(content, old, new),
        ]
    elif "claude" in model_lower:
        strategies = [
            lambda: try_str_replace_exact(content, old, new),
            lambda: try_str_replace_fuzzy(content, old, new),
        ]
    elif "gemini" in model_lower:
        strategies = [
            lambda: try_str_replace_fuzzy(content, old, new),
            lambda: try_str_replace_exact(content, old, new),
        ]
    elif "gpt" in model_lower or "openai" in model_lower:
        strategies = [
            lambda: try_apply_patch(content, old, new),
            lambda: try_str_replace_exact(content, old, new),
        ]
    elif "grok" in model_lower:
        strategies = [
            lambda: try_hashline_edit(content, old, new),
            lambda: try_str_replace_exact(content, old, new),
            lambda: try_str_replace_fuzzy(content, old, new),
        ]
    else:
        # Default: try everything
        strategies = [
            lambda: try_str_replace_exact(content, old, new),
            lambda: try_str_replace_fuzzy(content, old, new),
            lambda: try_apply_patch(content, old, new),
            lambda: try_regex_replace(content, old, new),
        ]

    # Also try line number if provided
    if line_num:
        strategies.insert(0, lambda: try_line_number_edit(content, old, new, line_num))

    # Try each strategy
    for strategy in strategies:
        success, new_content, format_name = strategy()
        if success:
            return new_content, format_name, True

    return content, "", False


def main():
    parser = argparse.ArgumentParser(
        description="Optimize edit format for maximum success rate"
    )
    parser.add_argument("--file", required=True, help="File to edit")
    parser.add_argument("--old", required=True, help="Old string to replace")
    parser.add_argument("--new", required=True, help="New string")
    parser.add_argument(
        "--model", default="auto", help="Model name (auto, claude, gemini, gpt, grok)"
    )
    parser.add_argument("--line", type=int, help="Line number to edit")
    parser.add_argument(
        "--dry-run", action="store_true", help="Don't write, just report"
    )

    args = parser.parse_args()

    new_content, format_used, success = optimize_edit(
        args.file, args.old, args.new, args.model, args.line
    )

    if success:
        print(f"SUCCESS: Using format '{format_used}'")

        if not args.dry_run:
            Path(args.file).write_text(new_content, encoding="utf-8")
            print(f"Written to: {args.file}")
        else:
            print(f"Would write {len(new_content)} chars to {args.file}")
    else:
        print("FAILED: No edit format worked", file=sys.stderr)
        print("Try providing more context or exact string match", file=sys.stderr)
        return 1

    return 0


if __name__ == "__main__":
    sys.exit(main())
