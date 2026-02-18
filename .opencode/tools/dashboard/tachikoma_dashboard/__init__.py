"""Tachikoma Dashboard - Real-time agent monitoring.

A Textual-based TUI for monitoring OpenCode agent sessions.

Features:
- Session tree visualization
- Real-time updates
- GITS-themed visuals with red accents
- Background data loading
"""

__version__ = "0.2.0"


def get_app():
    """Lazy import DashboardApp."""
    from .app import DashboardApp
    return DashboardApp


# Expose theme for external use
from .theme import THEME, GITSTheme

__all__ = ["get_app", "THEME", "GITSTheme", "__version__"]
