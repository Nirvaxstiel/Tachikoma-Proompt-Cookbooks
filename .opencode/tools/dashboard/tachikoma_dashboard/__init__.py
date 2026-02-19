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
from .theme import (
    THEME,
    ColorPalette,
    TEXTUAL_THEME,
    TEXTUAL_THEME_LIGHT,
    DASHBOARD_CSS,
    STATUS_COLORS,
    PRIORITY_COLORS,
    PANEL_BORDERS,
    register_themes,
    # Utility functions
    lighten,
    darken,
    blend,
    hex_with_alpha,
)

# Alias for backward compatibility
GITSTheme = ColorPalette

__all__ = [
    "get_app",
    "THEME",
    "ColorPalette",
    "GITSTheme",  # Backward compat alias
    "TEXTUAL_THEME",
    "TEXTUAL_THEME_LIGHT",
    "DASHBOARD_CSS",
    "STATUS_COLORS",
    "PRIORITY_COLORS",
    "PANEL_BORDERS",
    "register_themes",
    "lighten",
    "darken",
    "blend",
    "hex_with_alpha",
    "__version__",
]
