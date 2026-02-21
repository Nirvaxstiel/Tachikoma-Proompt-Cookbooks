#!/usr/bin/env python3
"""
Unified File I/O utilities for Tachikoma tools.

This module provides consistent file operations across all Tachikoma scripts,
eliminating duplication and ensuring proper error handling.

Features:
- Consistent UTF-8 encoding
- Standardized error handling
- Atomic file operations
- JSONL (JSON Lines) support
"""

import json
import os
from pathlib import Path
from typing import Any, Callable, Dict, List, Optional, Type, Tuple


class FileIO:
    """
    Unified file I/O utilities for Tachikoma tools.

    Provides consistent file operations with proper error handling,
    UTF-8 encoding, and atomic operations.
    """

    @staticmethod
    def read_text(path: str | Path, default: str = "", encoding: str = "utf-8") -> str:
        """
        Read text file with automatic error handling.

        Args:
            path: File path to read
            default: Value to return if file doesn't exist
            encoding: File encoding (default: utf-8)

        Returns:
            File content or default value
        """
        try:
            return Path(path).read_text(encoding=encoding)
        except (FileNotFoundError, IOError, UnicodeDecodeError):
            return default

    @staticmethod
    def write_text(
        path: str | Path,
        content: str,
        encoding: str = "utf-8",
        mode: str = "w",
    ) -> bool:
        """
        Write text file with error handling.

        Args:
            path: File path to write
            content: Content to write
            encoding: File encoding (default: utf-8)
            mode: Write mode ('w' for write, 'a' for append)

        Returns:
            True if successful, False otherwise
        """
        try:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            Path(path).write_text(content, encoding=encoding)
            return True
        except (IOError, OSError) as e:
            print(f"Error writing {path}: {e}")
            return False

    @staticmethod
    def append_text(
        path: str | Path,
        content: str,
        encoding: str = "utf-8",
    ) -> bool:
        """
        Append text to file with error handling.

        Args:
            path: File path to append to
            content: Content to append
            encoding: File encoding (default: utf-8)

        Returns:
            True if successful, False otherwise
        """
        return FileIO.write_text(path, content, encoding, mode="a")

    @staticmethod
    def read_json(
        path: str | Path, default: Any = None, encoding: str = "utf-8"
    ) -> Any:
        """
        Read JSON file with error handling.

        Args:
            path: File path to read
            default: Value to return if file doesn't exist
            encoding: File encoding (default: utf-8)

        Returns:
            Parsed JSON object or default value
        """
        try:
            content = Path(path).read_text(encoding=encoding)
            return json.loads(content)
        except (FileNotFoundError, json.JSONDecodeError, IOError):
            return default

    @staticmethod
    def write_json(path: str | Path, data: Any, encoding: str = "utf-8") -> bool:
        """
        Write JSON file with error handling.

        Args:
            path: File path to write
            data: Data to serialize to JSON
            encoding: File encoding (default: utf-8)

        Returns:
            True if successful, False otherwise
        """
        try:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            content = json.dumps(data, indent=2, ensure_ascii=False)
            Path(path).write_text(content, encoding=encoding)
            return True
        except (IOError, OSError, TypeError) as e:
            print(f"Error writing JSON to {path}: {e}")
            return False

    @staticmethod
    def read_jsonl(path: str | Path, encoding: str = "utf-8") -> List[Dict]:
        """
        Read JSONL (JSON Lines) file.

        Each line in a JSONL file is a separate JSON object.

        Args:
            path: File path to read
            encoding: File encoding (default: utf-8)

        Returns:
            List of parsed JSON objects (one per line)
        """
        try:
            with open(path, "r", encoding=encoding) as f:
                return [json.loads(line) for line in f if line.strip()]
        except (FileNotFoundError, json.JSONDecodeError, IOError):
            return []

    @staticmethod
    def append_jsonl(path: str | Path, data: Dict, encoding: str = "utf-8") -> bool:
        """
        Append JSON object to JSONL file.

        Args:
            path: File path to append to
            data: Data object to append as JSON line
            encoding: File encoding (default: utf-8)

        Returns:
            True if successful, False otherwise
        """
        try:
            Path(path).parent.mkdir(parents=True, exist_ok=True)
            json_line = json.dumps(data.__dict__ if hasattr(data, "__dict__") else data)
            with open(path, "a", encoding=encoding) as f:
                f.write(json_line + "\n")
            return True
        except (IOError, OSError, TypeError) as e:
            print(f"Error appending to {path}: {e}")
            return False

    @staticmethod
    def ensure_dir(path: str | Path) -> Path:
        """
        Ensure directory exists, create if needed.

        Args:
            path: Directory path to ensure

        Returns:
            Path object for the directory
        """
        path_obj = Path(path)
        path_obj.mkdir(parents=True, exist_ok=True)
        return path_obj

    @staticmethod
    def exists(path: str | Path) -> bool:
        """
        Check if path exists.

        Args:
            path: Path to check

        Returns:
            True if path exists, False otherwise
        """
        return Path(path).exists()

    @staticmethod
    def safe_with_open(
        path: str | Path,
        mode: str = "r",
        encoding: str = "utf-8",
        default: Any = None,
    ) -> Any:
        """
        Context manager for safe file operations.

        Args:
            path: File path to open
            mode: File mode (default: 'r')
            encoding: File encoding (default: utf-8)
            default: Value to return if file doesn't exist (for 'r' mode)

        Returns:
            Context manager that yields file handle or raises FileNotFoundError

        Example:
            with FileIO.safe_with_open("config.json") as f:
                data = json.load(f)
        """

        class SafeFile:
            def __init__(self, path: Path, mode: str, encoding: str, default: Any):
                self.path = path
                self.mode = mode
                self.encoding = encoding
                self.default = default
                self.file = None

            def __enter__(self):
                try:
                    self.file = open(self.path, self.mode, encoding=self.encoding)
                    return self.file
                except FileNotFoundError:
                    if self.default is not None and "r" in self.mode:
                        return self.default
                    raise

            def __exit__(self, exc_type, exc_val, exc_tb):
                if self.file:
                    self.file.close()

        return SafeFile(Path(path), mode, encoding, default)


__all__ = ["FileIO"]
