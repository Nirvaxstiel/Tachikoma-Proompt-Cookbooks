"""Centralized theme constants for GITS flavour with red accents.

All colors aligned with .opencode/themes/ghost-in-the-shell.json
"""

from dataclasses import dataclass


@dataclass(frozen=True)
class GITSTheme:
    """Immutable GITS theme configuration.
    
    Based on Ghost in the Shell aesthetic:
    - Dark cyberpunk backgrounds
    - Neon green primary accents
    - Cyan for secondary elements
    - Red for highlights that "pop"
    """
    
    # Backgrounds (dark mode)
    bg0: str = "#0a0e14"  # Deepest
    bg1: str = "#0d1117"  # Panel
    bg2: str = "#13171f"  # Element
    bg3: str = "#1a2332"  # Border
    bg5: str = "#2d3640"  # Muted element
    
    # Text
    text: str = "#b3e5fc"
    muted: str = "#4a5f6d"
    muted_bright: str = "#6b8e9e"
    
    # Accents
    green: str = "#00ff9f"   # Primary
    cyan: str = "#26c6da"    # Secondary
    teal: str = "#00d4aa"    # Tertiary
    red: str = "#ff0066"     # Highlight/pop
    orange: str = "#ffa726"  # Warning
    
    # Semantic
    success: str = "#00ff9f"
    warning: str = "#ffa726"
    error: str = "#ff0066"
    info: str = "#26c6da"


# Singleton theme instance
THEME = GITSTheme()


# Convenience color tuples for common patterns
STATUS_COLORS = {
    "working": (THEME.green, "●"),
    "active": (THEME.orange, "◐"),
    "idle": (THEME.muted, "○"),
}

PRIORITY_COLORS = {
    "high": THEME.red,
    "medium": THEME.orange,
    "low": THEME.muted,
}

PANEL_BORDERS = {
    "tree": THEME.green,      # Main panel - green border
    "details": THEME.cyan,    # Info panel - cyan border
    "skills": THEME.orange,   # Skills panel - orange border
    "todos": THEME.red,       # Todos panel - RED accent to pop
    "aggregation": THEME.muted,
}
