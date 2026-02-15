#!/usr/bin/env python3
"""
Hashline Generator - Add content-based line hashes for reliable editing.

Key insight: Hashline format can improve edit success rates.
When using hashlines, edits reference content hashes instead of exact strings.

Usage:
    # Read file with hashlines
    python hashline_generator.py read --file <path> [--output <outfile>]
    
    # Generate hashline content for editing
    python hashline_generator.py generate --file <path> [--output <outfile>]
    
    # Validate hashline content hasn't changed
    python hashline_generator.py validate --file <path>
"""

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple


def generate_line_hash(content: str) -> str:
    """Generate a short hash for line content."""
    return hashlib.md5(content.encode()).hexdigest()[:2]


def add_hashlines(content: str) -> str:
    """Add hashline tags to each line."""
    lines = content.split('\n')
    result = []
    
    for i, line in enumerate(lines, 1):
        line_hash = generate_line_hash(line)
        result.append(f"{i:02d}:{line_hash}|{line}")
    
    return '\n'.join(result)


def remove_hashlines(content: str) -> str:
    """Remove hashline tags, returning original content."""
    lines = content.split('\n')
    result = []
    
    for line in lines:
        # Match pattern: line_num:hash|content
        match = re.match(r'^\d+:[a-f0-9]{2}\|(.*)$', line)
        if match:
            result.append(match.group(1))
        else:
            result.append(line)
    
    return '\n'.join(result)


def validate_hashlines(content: str) -> Tuple[bool, List[Dict]]:
    """Validate that hashlines match content. Returns (is_valid, issues)."""
    lines = content.split('\n')
    issues = []
    
    for i, line in enumerate(lines, 1):
        match = re.match(r'^(\d+):([a-f0-9]{2})\|(.*)$', line)
        if not match:
            # No hashline tag, skip
            continue
            
        line_num = int(match.group(1))
        expected_hash = match.group(2)
        actual_content = match.group(3)
        
        actual_hash = generate_line_hash(actual_content)
        
        if actual_hash != expected_hash:
            issues.append({
                "line": i,
                "expected": expected_hash,
                "actual": actual_hash,
                "content": actual_content[:50] + "..." if len(actual_content) > 50 else actual_content
            })
    
    return len(issues) == 0, issues


def extract_hashes(content: str) -> Dict[str, str]:
    """Extract line number -> hash mapping."""
    lines = content.split('\n')
    hashes = {}
    
    for line in lines:
        match = re.match(r'^(\d+):([a-f0-9]{2})\|', line)
        if match:
            hashes[match.group(1)] = match.group(2)
    
    return hashes


def find_edit_location(content: str, target_hash: str, range_start: Optional[str] = None, 
                      range_end: Optional[str] = None) -> Optional[Dict]:
    """
    Find where to apply an edit using hashlines.
    
    Args:
        content: Hashline-tagged content
        target_hash: Hash to find (e.g., "2:f1")
        range_start: Start hash for range (e.g., "1:a3")
        range_end: End hash for range (e.g., "3:0e")
    
    Returns:
        Dict with line info or None if not found
    """
    lines = content.split('\n')
    
    # Parse target
    if ':' in target_hash:
        target_line, target_code = target_hash.split(':', 1)
    else:
        target_line = None
        target_code = target_hash
    
    # Find single line
    if target_line:
        for line in lines:
            match = re.match(r'^(\d+):([a-f0-9]{2})\|', line)
            if match and match.group(1) == target_line and match.group(2) == target_code:
                return {
                    "type": "single",
                    "line": int(target_line),
                    "hash": target_code,
                    "content": line.split('|', 1)[1] if '|' in line else line
                }
    
    # Find by hash only
    for line in lines:
        match = re.match(r'^(\d+):([a-f0-9]{2})\|', line)
        if match and match.group(2) == target_code:
            return {
                "type": "hash_match",
                "line": int(match.group(1)),
                "hash": target_code,
                "content": line.split('|', 1)[1] if '|' in line else line
            }
    
    return None


def cmd_read(args: argparse.Namespace) -> int:
    """Read file and output with hashlines."""
    path = Path(args.file)
    if not path.exists():
        print(f"ERROR: File not found: {args.file}", file=sys.stderr)
        return 1
    
    content = path.read_text(encoding='utf-8')
    hashlined = add_hashlines(content)
    
    if args.output:
        Path(args.output).write_text(hashlined, encoding='utf-8')
        print(f"Written hashlined content to: {args.output}")
    else:
        print(hashlined)
    
    return 0


def cmd_generate(args: argparse.Namespace) -> int:
    """Generate hashline content (alias for read)."""
    return cmd_read(args)


def cmd_validate(args: argparse.Namespace) -> int:
    """Validate hashline content."""
    path = Path(args.file)
    if not path.exists():
        print(f"ERROR: File not found: {args.file}", file=sys.stderr)
        return 1
    
    content = path.read_text(encoding='utf-8')
    is_valid, issues = validate_hashlines(content)
    
    if is_valid:
        print("✓ All hashlines valid")
        return 0
    else:
        print(f"✗ {len(issues)} hashline mismatches:")
        for issue in issues[:10]:
            print(f"  Line {issue['line']}: expected {issue['expected']}, got {issue['actual']}")
            print(f"    Content: {issue['content']}")
        return 1


def cmd_extract(args: argparse.Namespace) -> int:
    """Extract hash mappings as JSON."""
    path = Path(args.file)
    if not path.exists():
        print(f"ERROR: File not found: {args.file}", file=sys.stderr)
        return 1
    
    content = path.read_text(encoding='utf-8')
    hashes = extract_hashes(content)
    
    print(json.dumps(hashes, indent=2))
    return 0


def cmd_find(args: argparse.Namespace) -> int:
    """Find edit location using hashline."""
    path = Path(args.file)
    if not path.exists():
        print(f"ERROR: File not found: {args.file}", file=sys.stderr)
        return 1
    
    content = path.read_text(encoding='utf-8')
    
    result = find_edit_location(
        content, 
        args.hash, 
        args.range_start, 
        args.range_end
    )
    
    if result:
        print(json.dumps(result, indent=2))
        return 0
    else:
        print(f"ERROR: Hash not found: {args.hash}", file=sys.stderr)
        return 1


def main():
    parser = argparse.ArgumentParser(description="Hashline Generator")
    subparsers = parser.add_subparsers(dest="cmd", required=True)
    
    # Read command
    p_read = subparsers.add_parser("read", help="Read file with hashlines")
    p_read.add_argument("--file", required=True, help="Input file")
    p_read.add_argument("--output", help="Output file (default: stdout)")
    
    # Generate command (alias)
    p_gen = subparsers.add_parser("generate", help="Generate hashlines (alias for read)")
    p_gen.add_argument("--file", required=True, help="Input file")
    p_gen.add_argument("--output", help="Output file (default: stdout)")
    
    # Validate command
    p_val = subparsers.add_parser("validate", help="Validate hashline content")
    p_val.add_argument("--file", required=True, help="File to validate")
    
    # Extract command
    p_ext = subparsers.add_parser("extract", help="Extract hash mappings as JSON")
    p_ext.add_argument("--file", required=True, help="File to extract from")
    
    # Find command
    p_find = subparsers.add_parser("find", help="Find edit location by hash")
    p_find.add_argument("--file", required=True, help="Hashlined file")
    p_find.add_argument("--hash", required=True, help="Hash to find (e.g., '2:f1')")
    p_find.add_argument("--range-start", help="Start hash for range")
    p_find.add_argument("--range-end", help="End hash for range")
    
    args = parser.parse_args()
    
    if args.cmd == "read":
        return cmd_read(args)
    elif args.cmd == "generate":
        return cmd_generate(args)
    elif args.cmd == "validate":
        return cmd_validate(args)
    elif args.cmd == "extract":
        return cmd_extract(args)
    elif args.cmd == "find":
        return cmd_find(args)
    else:
        print(f"Unknown command: {args.cmd}", file=sys.stderr)
        return 1


if __name__ == "__main__":
    sys.exit(main())
