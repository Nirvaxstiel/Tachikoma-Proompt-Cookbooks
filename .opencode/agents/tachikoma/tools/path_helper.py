#!/usr/bin/env python3
"""
Path Helper - Centralized Python/UV detection for Tachikoma

Usage:
    from path_helper import find_python, find_uv, detect_runtime

    python = find_python()
    uv = find_uv()

    # Or detect both at once
    python, uv = detect_runtime()

Detection order:
    1. Environment variables (PYTHON, UV) - set by opencode injection
    2. System PATH (python, python3, uv)
    3. Bundled assets (.opencode/assets/Python310, .opencode/assets/uv.exe)
"""

from __future__ import annotations

import os
import shutil
import sys
from pathlib import Path
from typing import Optional, Tuple


# ===========================================================================
# Directory Detection
# ===========================================================================


def _get_opencode_dir() -> Path:
    """Get the .opencode directory path."""
    # This file is in .opencode/tools/
    return Path(__file__).parent.parent.resolve()


def _get_assets_dir() -> Path:
    """Get the assets directory path."""
    return _get_opencode_dir() / "assets"


# ===========================================================================
# Python Detection
# ===========================================================================


def find_python() -> Optional[str]:
    """
    Find Python executable.

    Detection order:
        1. PYTHON environment variable (injected by opencode)
        2. System PATH (python, python3)
        3. Bundled Python in assets/

    Returns:
        Path to Python executable, or None if not found.
    """
    # 1. Environment variable (injected by opencode plugin)
    if python := os.environ.get("PYTHON"):
        return python

    # 2. System PATH
    if python := shutil.which("python"):
        return python

    if python := shutil.which("python3"):
        return python

    # 3. Bundled Python
    assets_dir = _get_assets_dir()
    opencode_dir = _get_opencode_dir()

    bundled_locations = [
        assets_dir / "Python310" / "python.exe",
        assets_dir / "Python310" / "python",
        assets_dir / "Python310" / "python3.exe",
        assets_dir / "Python310" / "python3",
        assets_dir / "Python" / "python.exe",
        assets_dir / "Python" / "python",
        opencode_dir / "Python310" / "python.exe",
        opencode_dir / "Python310" / "python",
    ]

    for loc in bundled_locations:
        if loc.exists():
            return str(loc)

    # 4. Fallback to current Python
    return sys.executable


def has_python() -> bool:
    """Check if Python is available."""
    return find_python() is not None


def get_python_dir() -> Optional[Path]:
    """Get the directory containing the Python executable."""
    python = find_python()
    if python:
        return Path(python).parent
    return None


# ===========================================================================
# UV Detection
# ===========================================================================


def find_uv() -> Optional[str]:
    """
    Find UV executable.

    Detection order:
        1. UV environment variable (injected by opencode)
        2. System PATH (uv)
        3. Bundled UV in assets/

    Returns:
        Path to UV executable, or None if not found.
    """
    # 1. Environment variable (injected by opencode plugin)
    if uv := os.environ.get("UV"):
        return uv

    # 2. System PATH
    if uv := shutil.which("uv"):
        return uv

    # 3. Bundled UV
    assets_dir = _get_assets_dir()
    opencode_dir = _get_opencode_dir()

    bundled_locations = [
        assets_dir / "uv.exe",
        assets_dir / "uv",
        opencode_dir / "uv.exe",
        opencode_dir / "uv",
    ]

    for loc in bundled_locations:
        if loc.exists():
            return str(loc)

    return None


def has_uv() -> bool:
    """Check if UV is available."""
    return find_uv() is not None


def get_uv_cache_dir() -> Path:
    """Get the UV cache directory path."""
    return _get_opencode_dir() / "cache" / "uv"


# ===========================================================================
# Combined Detection
# ===========================================================================


def detect_runtime() -> Tuple[Optional[str], Optional[str]]:
    """
    Detect both Python and UV.

    Returns:
        Tuple of (python_path, uv_path), either may be None.
    """
    return find_python(), find_uv()


class RuntimeConfig:
    """
    Runtime configuration with detected Python and UV paths.

    Usage:
        config = RuntimeConfig.detect()
        print(f"Python: {config.python}")
        print(f"UV: {config.uv}")
    """

    python: Optional[str] = None
    uv: Optional[str] = None

    @classmethod
    def detect(cls) -> "RuntimeConfig":
        """Detect and return runtime configuration."""
        config = cls()
        config.python = find_python()
        config.uv = find_uv()
        return config

    def __repr__(self) -> str:
        return f"RuntimeConfig(python={self.python!r}, uv={self.uv!r})"


# ===========================================================================
# Utility Functions
# ===========================================================================


def get_assets_dir() -> Path:
    """Get the assets directory path."""
    return _get_assets_dir()


def get_opencode_dir() -> Path:
    """Get the .opencode directory path."""
    return _get_opencode_dir()


def print_runtime_info() -> None:
    """Print runtime information to stdout."""
    python = find_python()
    uv = find_uv()

    if python:
        source = " (from env)" if os.environ.get("PYTHON") else ""
        print(f"Python: {python}{source}")
    else:
        print("Python: not found")

    if uv:
        source = " (from env)" if os.environ.get("UV") else ""
        print(f"UV: {uv}{source}")
    else:
        print("UV: not found")


# ===========================================================================
# CLI Entry Point
# ===========================================================================


def main() -> None:
    """CLI entry point for testing."""
    import argparse

    parser = argparse.ArgumentParser(description="Path Helper - Detect Python and UV")
    parser.add_argument("--python", action="store_true", help="Print Python path")
    parser.add_argument("--uv", action="store_true", help="Print UV path")
    parser.add_argument("--assets", action="store_true", help="Print assets directory")
    parser.add_argument(
        "--opencode", action="store_true", help="Print .opencode directory"
    )
    parser.add_argument("--json", action="store_true", help="Output as JSON")

    args = parser.parse_args()

    if args.json:
        import json

        result = {
            "python": find_python(),
            "uv": find_uv(),
            "assets_dir": str(get_assets_dir()),
            "opencode_dir": str(get_opencode_dir()),
        }
        print(json.dumps(result, indent=2))
    elif args.python:
        python = find_python()
        print(python or "not found")
    elif args.uv:
        uv = find_uv()
        print(uv or "not found")
    elif args.assets:
        print(get_assets_dir())
    elif args.opencode:
        print(get_opencode_dir())
    else:
        print_runtime_info()


if __name__ == "__main__":
    main()
