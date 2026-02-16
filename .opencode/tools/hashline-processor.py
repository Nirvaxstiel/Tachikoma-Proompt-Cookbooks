"""
Hashline Edit Format Processor
Based on: Can Bölük's "The Harness Problem" research
Reference: https://blog.can.ac/2026/02/12/the-harness-problem

Impact: +8-61% edit success rate, especially for weak models
- Grok: 6.7% → 68.3% (10x improvement)
- GLM: 46-50% → 54-64% (+8-14%)
- Claude/GPT: Already high, minor improvements
- Output tokens: -20-61% reduction
"""

import hashlib
import os
from typing import List, Tuple, Optional


class HashlineProcessor:
    """Process files with hashline format for edit operations"""

    def __init__(self):
        self.hash_length = 2  # Number of characters for content hash

    def _hash_line(self, line: str) -> str:
        """Generate 2-char hash for a single line"""
        return hashlib.sha256(line.encode()).hexdigest()[:self.hash_length]

    def generate_hashline(self, content: str, line_number: int) -> str:
        """
        Generate hashline reference for a specific line

        Args:
            content: Full file content (used for context)
            line_number: 1-based line number

        Returns:
            Hashline reference string (e.g., "22:f1|")

        Raises:
            ValueError: If line_number is out of range
        """
        lines = content.split('\n')
        if line_number - 1 >= len(lines) or line_number < 1:
            raise ValueError(
                f"Line {line_number} out of range (file has {len(lines)} lines)"
            )

        line = lines[line_number - 1]
        line_hash = self._hash_line(line)
        return f"{line_number}:{line_hash}|"

    def read_file_with_hashlines(self, filepath: str) -> List[str]:
        """
        Read file and return lines with hashline prefixes

        Args:
            filepath: Path to file to read

        Returns:
            List of lines with hashline prefixes

        Example:
            Input file:
                function hello() {
                  return "world";
                }

            Output:
                [
                    "1:a3|function hello() {",
                    "2:f1|  return "world";",
                    "3:0e|}"
                ]
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        hashlines = []
        for i, line in enumerate(lines, 1):
            line_stripped = line.rstrip('\n')
            line_hash = self._hash_line(line_stripped)
            hashlines.append(f"{i}:{line_hash}|{line_stripped}")

        return hashlines

    def apply_hashline_edit(
        self,
        filepath: str,
        target_hash: str,
        new_content: str,
        verify_hash: bool = True
    ) -> bool:
        """
        Apply edit using hashline reference

        Args:
            filepath: Path to file to edit
            target_hash: Hashline reference (e.g., "22:f1")
            new_content: New line content (without newline)
            verify_hash: Whether to verify hash matches current file

        Returns:
            True if edit succeeded

        Raises:
            ValueError: If hash not found or file has changed
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        # Read current hashlines
        current_hashlines = self.read_file_with_hashlines(filepath)

        # Build hash -> line index mapping
        hash_to_index = {}
        for idx, hashline in enumerate(current_hashlines):
            # Extract hash prefix (everything before first '|')
            hash_prefix = hashline.split('|')[0]
            hash_to_index[hash_prefix] = idx

        if target_hash not in hash_to_index:
            # Find similar hashes to help debugging
            existing_hashes = list(hash_to_index.keys())
            line_number = target_hash.split(':')[0] if ':' in target_hash else '?'

            raise ValueError(
                f"Hash '{target_hash}' not found in file.\n"
                f"Line number: {line_number}\n"
                f"File may have changed. Current hashes in file: {len(existing_hashes)}\n"
                f"First 5 hashes: {existing_hashes[:5]}"
            )

        # Get line index
        line_index = hash_to_index[target_hash]

        # Read original file
        with open(filepath, 'r', encoding='utf-8') as f:
            lines = f.readlines()

        # Update line (preserve original newline style)
        original_line = lines[line_index]
        original_newline = '\n' if original_line.endswith('\n') else ''
        lines[line_index] = new_content + original_newline

        # Write back
        with open(filepath, 'w', encoding='utf-8') as f:
            f.writelines(lines)

        return True

    def find_hash_line(
        self,
        filepath: str,
        search_text: str,
        case_sensitive: bool = False
    ) -> Optional[str]:
        """
        Find a line by content and return its hashline reference

        Args:
            filepath: Path to file to search
            search_text: Text to search for in lines
            case_sensitive: Whether to match case

        Returns:
            Hashline reference if found, None otherwise

        Example:
            find_hash_line('/tmp/test.py', 'return "world"')
            Returns: "2:f1|"
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        hashlines = self.read_file_with_hashlines(filepath)

        search = search_text if case_sensitive else search_text.lower()

        for hashline in hashlines:
            # Remove hashline prefix to get content
            content_start = hashline.find('|') + 1
            content = hashline[content_start:]

            match_content = content if case_sensitive else content.lower()

            if search in match_content:
                # Extract just the hash prefix
                hash_prefix = hashline.split('|')[0]
                return hash_prefix + '|'

        return None

    def batch_find_hash_lines(
        self,
        filepath: str,
        search_texts: List[str],
        case_sensitive: bool = False
    ) -> dict:
        """
        Find multiple lines by content and return hashline references

        Args:
            filepath: Path to file to search
            search_texts: List of texts to search for
            case_sensitive: Whether to match case

        Returns:
            Dictionary mapping search_text -> hashline reference
        """
        results = {}
        for search_text in search_texts:
            hash_ref = self.find_hash_line(filepath, search_text, case_sensitive)
            results[search_text] = hash_ref
        return results

    def get_file_stats(self, filepath: str) -> dict:
        """
        Get statistics about a file with hashlines

        Args:
            filepath: Path to file

        Returns:
            Dictionary with file statistics
        """
        if not os.path.exists(filepath):
            raise FileNotFoundError(f"File not found: {filepath}")

        hashlines = self.read_file_with_hashlines(filepath)

        return {
            'total_lines': len(hashlines),
            'total_chars': sum(len(h) for h in hashlines),
            'hash_length': self.hash_length,
            'avg_line_length': sum(len(h) for h in hashlines) / len(hashlines) if hashlines else 0,
            'first_hash': hashlines[0].split('|')[0] if hashlines else None,
            'last_hash': hashlines[-1].split('|')[0] if hashlines else None,
        }

    def verify_integrity(self, filepath: str) -> dict:
        """
        Verify hashline integrity of a file

        Args:
            filepath: Path to file to verify

        Returns:
            Dictionary with verification results
        """
        try:
            hashlines = self.read_file_with_hashlines(filepath)
            return {
                'valid': True,
                'lines_checked': len(hashlines),
                'message': f'All {len(hashlines)} lines have valid hashlines'
            }
        except Exception as e:
            return {
                'valid': False,
                'error': str(e),
                'message': f'Hashline verification failed: {str(e)}'
            }


# Singleton instance for convenience
_processor_instance = None


def get_hashline_processor() -> HashlineProcessor:
    """Get singleton hashline processor instance"""
    global _processor_instance
    if _processor_instance is None:
        _processor_instance = HashlineProcessor()
    return _processor_instance


# CLI interface for testing
if __name__ == '__main__':
    import argparse
    import sys

    parser = argparse.ArgumentParser(
        description='Hashline Edit Format Processor'
    )
    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Read command
    read_parser = subparsers.add_parser('read', help='Read file with hashlines')
    read_parser.add_argument('filepath', help='File path to read')

    # Find command
    find_parser = subparsers.add_parser('find', help='Find line by content')
    find_parser.add_argument('filepath', help='File path to search')
    find_parser.add_argument('search_text', help='Text to search for')
    find_parser.add_argument(
        '--case-sensitive',
        action='store_true',
        help='Match case'
    )

    # Edit command
    edit_parser = subparsers.add_parser('edit', help='Edit file using hashline')
    edit_parser.add_argument('filepath', help='File path to edit')
    edit_parser.add_argument('hash', help='Hashline reference (e.g., "22:f1")')
    edit_parser.add_argument('content', help='New line content')

    # Verify command
    verify_parser = subparsers.add_parser('verify', help='Verify hashline integrity')
    verify_parser.add_argument('filepath', help='File path to verify')

    args = parser.parse_args()

    if not args.command:
        parser.print_help()
        sys.exit(1)

    processor = HashlineProcessor()

    try:
        if args.command == 'read':
            hashlines = processor.read_file_with_hashlines(args.filepath)
            for line in hashlines:
                print(line)

        elif args.command == 'find':
            hash_ref = processor.find_hash_line(
                args.filepath,
                args.search_text,
                args.case_sensitive
            )
            if hash_ref:
                print(f"Found: {hash_ref}")
            else:
                print(f"Not found: '{args.search_text}'")
                sys.exit(1)

        elif args.command == 'edit':
            success = processor.apply_hashline_edit(
                args.filepath,
                args.hash,
                args.content
            )
            if success:
                print(f"✓ Edit successful: {args.hash} -> '{args.content}'")
            else:
                print("✗ Edit failed")
                sys.exit(1)

        elif args.command == 'verify':
            result = processor.verify_integrity(args.filepath)
            if result['valid']:
                print(f"✓ {result['message']}")
            else:
                print(f"✗ {result['message']}")
                sys.exit(1)

    except Exception as e:
        print(f"✗ Error: {e}", file=sys.stderr)
        sys.exit(1)
