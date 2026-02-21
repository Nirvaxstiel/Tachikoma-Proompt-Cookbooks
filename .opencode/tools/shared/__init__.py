#!/usr/bin/env python3
"""
Shared utility functions for Tachikoma tools.

This module provides commonly-used utility functions that are
used across multiple modules to reduce code duplication.
"""

from typing import Optional


def truncate_text(text: Optional[str], max_length: int, default: str = "...") -> str:
    """
    Truncate text with ellipsis.

    Args:
        text: Text to truncate
        max_length: Maximum length including ellipsis
        default: Default value if text is None

    Returns:
        Truncated text or default value
    """
    if not text:
        return default or ""
    if len(text) <= max_length:
        return text
    return text[: max_length - 3] + "..."


# Import hash utilities
from .hash_utils import (
    generate_hash,
    generate_hashline,
    generate_node_id,
    generate_ref_id,
)

# Import terminal utilities
from .terminal import (
    TerminalColors,
    TerminalUI,
    GITSTheme,  # Backward compatibility
    Colors,  # Backward compatibility
)

# Import file I/O utilities
from .file_io import FileIO

# Import configuration manager
from .config_manager import ConfigManager

# Import metrics calculator
from .metrics import Metrics

__all__ = [
    "truncate_text",
    "generate_hash",
    "generate_hashline",
    "generate_node_id",
    "generate_ref_id",
    "TerminalColors",
    "TerminalUI",
    "GITSTheme",
    "Colors",
    "FileIO",
    "ConfigManager",
    "Metrics",
]
