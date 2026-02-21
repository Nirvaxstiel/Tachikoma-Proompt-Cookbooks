#!/usr/bin/env python3
"""
Unified Terminal UI for Tachikoma tools.

This module provides consistent terminal styling, colors, and UI utilities
across all Tachikoma scripts, eliminating duplication.

Features:
- Single source of truth for colors
- Consistent ANSI codes
- ASCII-safe output for Windows
- Reusable UI patterns
"""

from typing import Optional


class TerminalColors:
    """
    Unified ANSI color definitions for terminal output.

    Uses 256-color ANSI codes for better aesthetics while maintaining
    compatibility with Windows terminals via ASCII-safe characters.
    """

    # Primary palette (Ghost in the Shell theme)
    NEON_GREEN = "\033[38;5;48m"  # #00ff9f
    CYAN = "\033[38;5;51m"       # #26c6da
    TEAL = "\033[38;5;43m"       # #00d4aa
    CRIMSON = "\033[38;5;197m"  # #ff0066
    AMBER = "\033[38;5;214m"    # #ffa726
    ICE_BLUE = "\033[38;5;153m"  # #b3e5fc

    # Muted tones
    STEEL = "\033[38;5;240m"   # #4a5f6d
    SLATE = "\033[38;5;66m"    # #6b8e9e
    MIDNIGHT = "\033[38;5;235m" # #0a0e14
    DEEP_BLUE = "\033[38;5;234m" # #0d1117

    # Basic colors (fallback for compatibility)
    RED = "\033[0;31m"
    GREEN = "\033[0;32m"
    YELLOW = "\033[1;33m"
    BLUE = "\033[0;34m"
    MAGENTA = "\033[0;35m"

    # Reset
    NC = "\033[0m"  # No Color

    # Backgrounds
    BG_DARK = "\033[48;5;234m"

    # Styles
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"
    BLINK = "\033[5m"
    REVERSE = "\033[7m"

    # ASCII-safe symbols for Windows compatibility
    CHECK = "[+]"
    WARNING = "[!]"
    ERROR = "[x]"
    ARROW = "->"
    INFO = ">"

    @classmethod
    def status_color(
        cls, status: str
    ) -> str:
        """
        Get color for status strings.

        Args:
            status: Status string (e.g., 'pass', 'fail', 'warn')

        Returns:
            ANSI color code
        """
        status_lower = status.lower()

        if status_lower in ("pass", "success", "+"):
            return cls.NEON_GREEN
        elif status_lower in ("fail", "error", "!", "x"):
            return cls.CRIMSON
        elif status_lower in ("warn", "warning", "~"):
            return cls.AMBER
        elif status_lower in ("skip", "-", "skipped"):
            return cls.STEEL
        else:
            return cls.ICE_BLUE

    @classmethod
    def status_icon(cls, status: str) -> str:
        """
        Get icon for status - ASCII-safe for Windows.

        Args:
            status: Status string (e.g., 'pass', 'fail', 'warn')

        Returns:
            Single-character icon
        """
        status_lower = status.lower()

        if status_lower in ("pass", "success", "+"):
            return "+"
        elif status_lower in ("fail", "error", "!", "x"):
            return "!"
        elif status_lower in ("warn", "warning", "~"):
            return "~"
        elif status_lower in ("skip", "-", "skipped"):
            return "-"
        else:
            return cls.INFO


class TerminalUI:
    """
    Terminal UI utilities for consistent output formatting.

    Provides reusable methods for common terminal patterns.
    """

    @staticmethod
    def header(text: str, char: str = "=", color: str = None) -> str:
        """
        Create a header with text centered.

        Args:
            text: Header text
            char: Border character (default: "=")
            color: ANSI color code (optional)

        Returns:
            Formatted header string
        """
        t = TerminalColors()
        c = color or t.BLUE
        line = char * 60

        if color:
            return f"{c}{line}{t.NC}\n{c}{text}{t.NC}\n{c}{line}{t.NC}"
        else:
            return f"{line}\n{text}\n{line}"

    @staticmethod
    def success(message: str) -> str:
        """
        Format success message.

        Args:
            message: Success message

        Returns:
            Formatted string with green checkmark
        """
        t = TerminalColors()
        return f"{t.GREEN}{t.CHECK}{t.NC} {message}"

    @staticmethod
    def warning(message: str) -> str:
        """
        Format warning message.

        Args:
            message: Warning message

        Returns:
            Formatted string with yellow warning icon
        """
        t = TerminalColors()
        return f"{t.YELLOW}{t.WARNING}{t.NC} {message}"

    @staticmethod
    def error(message: str) -> str:
        """
        Format error message.

        Args:
            message: Error message

        Returns:
            Formatted string with red error icon
        """
        t = TerminalColors()
        return f"{t.RED}{t.ERROR}{t.NC} {message}"

    @staticmethod
    def info(message: str) -> str:
        """
        Format info message.

        Args:
            message: Info message

        Returns:
            Formatted string with blue info icon
        """
        t = TerminalColors()
        return f"{t.CYAN}{t.INFO}{t.NC} {message}"

    @staticmethod
    def status(status: str, message: str) -> str:
        """
        Format status message with color.

        Args:
            status: Status string (pass, fail, warn, skip)
            message: Status message

        Returns:
            Formatted string with appropriate color and icon
        """
        t = TerminalColors()
        color = t.status_color(status)
        icon = t.status_icon(status)
        return f"{color}{icon}{t.NC} {message}"

    @staticmethod
    def box_top(title: str = "", color: str = None) -> str:
        """
        Create box top border with optional title.

        Args:
            title: Optional title to center in border
            color: ANSI color code (optional)

        Returns:
            Box top border line
        """
        t = TerminalColors()
        c = color or t.STEEL
        line = "=" * 58

        if title:
            visible_len = len(title)
            padding = (58 - visible_len - 4) // 2
            left = "+" + "=" * padding
            right = "=" * (58 - padding - visible_len - 4) + "+"
            return f"{c}{left} {t.BOLD}{title} {c}{right}{t.NC}"
        else:
            return f"{c}+{line}+{t.NC}"

    @staticmethod
    def box_bottom(color: str = None) -> str:
        """
        Create box bottom border.

        Args:
            color: ANSI color code (optional)

        Returns:
            Box bottom border line
        """
        t = TerminalColors()
        c = color or t.STEEL
        return f"{c}+{'=' * 58}+{t.NC}"

    @staticmethod
    def box_line(
        content: str = "", color: str = None, align: str = "left"
    ) -> str:
        """
        Create box content line.

        Args:
            content: Line content
            color: ANSI color code (optional)
            align: Text alignment (left, center, right)

        Returns:
            Box content line
        """
        t = TerminalColors()
        c = color or t.STEEL
        inner_width = 56
        visible_len = len(content)

        if align == "center":
            padding = (inner_width - visible_len) // 2
            text = " " * padding + content + " * (
                inner_width - padding - visible_len
            )
        elif align == "right":
            text = " " * (inner_width - visible_len) + content
        else:  # left
            text = content + " " * (inner_width - visible_len)

        # Truncate if too long
        if len(text) > inner_width:
            text = text[: inner_width - 3] + "..."

        return f"{c}|{t.NC} {text} {c}|{t.NC}"

    @staticmethod
    def hr(char: str = "-", color: str = None) -> str:
        """
        Create horizontal rule.

        Args:
            char: Character to repeat
            color: ANSI color code (optional)

        Returns:
            Horizontal rule string
        """
        t = TerminalColors()
        c = color or t.STEEL
        return f"{c}{char * 60}{t.NC}"

    @staticmethod
    def section_header(title: str, icon: str = ">") -> str:
        """
        Create section header.

        Args:
            title: Section title
            icon: Icon to use (default: >)

        Returns:
            Formatted section header
        """
        t = TerminalColors()
        return f"\n{t.BOLD}{t.CYAN}{icon} {title.upper()}{t.NC}\n{t.DIM}{t.hr('-', t.STEEL)}{t.NC}"

    @staticmethod
    def print_header(text: str, char: str = "=", color: str = None):
        """Print header to stdout."""
        print(TerminalUI.header(text, char, color))

    @staticmethod
    def print_success(message: str):
        """Print success message to stdout."""
        print(TerminalUI.success(message))

    @staticmethod
    def print_warning(message: str):
        """Print warning message to stdout."""
        print(TerminalUI.warning(message))

    @staticmethod
    def print_error(message: str):
        """Print error message to stdout."""
        print(TerminalUI.error(message))

    @staticmethod
    def print_info(message: str):
        """Print info message to stdout."""
        print(TerminalUI.info(message))

    @staticmethod
    def print_status(status: str, message: str):
        """Print status message to stdout."""
        print(TerminalUI.status(status, message))


# Backward compatibility aliases
GITSTheme = TerminalColors
Colors = TerminalColors


__all__ = [
    "TerminalColors",
    "TerminalUI",
    "GITSTheme",  # Alias for backward compatibility
    "Colors",  # Alias for backward compatibility
]
