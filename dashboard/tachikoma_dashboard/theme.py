"""Functional theming system for GITS flavour.

This module provides a functional approach to theming:
- Pure functions for color manipulation
- Theme composition and overriding
- CSS generation from theme data
- No mutable state - immutable theme objects

Architecture:
- color_utils: Pure functions for color manipulation
- theme_builder: Functions to create and compose themes
- variables: Theme variable definitions
- css: CSS generation utilities
"""

from __future__ import annotations

import re
from dataclasses import dataclass, field
from functools import partial
from typing import Callable, TypeVar, Generic

# =============================================================================
# Type Definitions
# =============================================================================

T = TypeVar('T')
HexColor = str  # e.g., "#00ff9f" or "#fff"


# =============================================================================
# Color Utilities (Pure Functions)
# =============================================================================

def hex_to_rgb(hex_color: HexColor) -> tuple[int, int, int]:
    """Parse hex color to RGB tuple."""
    hex_color = hex_color.lstrip('#')
    if len(hex_color) == 3:
        hex_color = ''.join(c * 2 for c in hex_color)
    return tuple(int(hex_color[i:i+2], 16) for i in (0, 2, 4))


def rgb_to_hex(r: int, g: int, b: int) -> HexColor:
    """Convert RGB to hex color."""
    return f"#{r:02x}{g:02x}{b:02x}"


def hex_with_alpha(hex_color: HexColor, alpha_percent: int) -> HexColor:
    """Add alpha to hex color (e.g., "#00ff9f40" for 25% opacity)."""
    return f"{hex_color}{alpha_percent:02x}"


def lighten(hex_color: HexColor, amount: float) -> HexColor:
    """Lighten a color by amount (0.0-1.0)."""
    r, g, b = hex_to_rgb(hex_color)
    return rgb_to_hex(
        min(255, int(r + (255 - r) * amount)),
        min(255, int(g + (255 - g) * amount)),
        min(255, int(b + (255 - b) * amount)),
    )


def darken(hex_color: HexColor, amount: float) -> HexColor:
    """Darken a color by amount (0.0-1.0)."""
    r, g, b = hex_to_rgb(hex_color)
    return rgb_to_hex(
        max(0, int(r - r * amount)),
        max(0, int(g - g * amount)),
        max(0, int(b - b * amount)),
    )


def blend(color1: HexColor, color2: HexColor, amount: float = 0.5) -> HexColor:
    """Blend two colors together (amount: 0 = color1, 1 = color2)."""
    r1, g1, b1 = hex_to_rgb(color1)
    r2, g2, b2 = hex_to_rgb(color2)
    return rgb_to_hex(
        int(r1 + (r2 - r1) * amount),
        int(g1 + (g2 - g1) * amount),
        int(b1 + (b2 - b1) * amount),
    )


def adjust_gamma(hex_color: HexColor, gamma: float) -> HexColor:
    """Adjust color gamma for luminosity spread."""
    r, g, b = hex_to_rgb(hex_color)
    return rgb_to_hex(
        int(255 * (r / 255) ** gamma),
        int(255 * (g / 255) ** gamma),
        int(255 * (b / 255) ** gamma),
    )


# =============================================================================
# Theme Data Structures
# =============================================================================

@dataclass(frozen=True)
class ColorPalette:
    """Immutable color palette - the foundation of theming."""
    
    # Backgrounds
    bg0: HexColor = "#0a0e14"  # Deepest
    bg1: HexColor = "#0d1117"  # Panel
    bg2: HexColor = "#13171f"  # Element
    bg3: HexColor = "#1a2332"  # Border
    bg5: HexColor = "#2d3640"  # Muted
    
    # Text
    text: HexColor = "#b3e5fc"
    muted: HexColor = "#4a5f6d"
    muted_bright: HexColor = "#6b8e9e"
    
    # Accents
    green: HexColor = "#00ff9f"   # Primary
    cyan: HexColor = "#26c6da"    # Secondary
    teal: HexColor = "#00d4aa"    # Tertiary
    red: HexColor = "#ff0066"     # Accent/pop
    orange: HexColor = "#ffa726"  # Warning
    
    # Semantic (derived)
    success: HexColor = "#00ff9f"
    warning: HexColor = "#ffa726"
    error: HexColor = "#ff0066"
    info: HexColor = "#26c6da"


# Default GITS palette
GITS_PALETTE = ColorPalette()


# =============================================================================
# Theme Builder (Functional Composition)
# =============================================================================

@dataclass(frozen=True)
class ThemeVariables:
    """Theme variables - computed from palette + config."""
    
    # Standard Textual variables
    primary: HexColor
    secondary: HexColor
    accent: HexColor
    warning: HexColor
    error: HexColor
    success: HexColor
    foreground: HexColor
    background: HexColor
    surface: HexColor
    panel: HexColor
    dark: bool
    
    # Custom GITS variables
    teal: HexColor
    highlight_cursor: HexColor
    highlight_cursor_text: HexColor
    highlight_hover: HexColor
    highlight_header_skills: HexColor
    highlight_header_todos: HexColor
    text_muted: HexColor
    
    # Extra overrides
    extras: dict[str, HexColor] = field(default_factory=dict)
    
    def to_dict(self) -> dict[str, HexColor]:
        """Convert to dictionary for Textual."""
        base = {
            "primary": self.primary,
            "secondary": self.secondary,
            "accent": self.accent,
            "warning": self.warning,
            "error": self.error,
            "success": self.success,
            "foreground": self.foreground,
            "background": self.background,
            "surface": self.surface,
            "panel": self.panel,
            "teal": self.teal,
            "highlight-cursor": self.highlight_cursor,
            "highlight-cursor-text": self.highlight_cursor_text,
            "highlight-hover": self.highlight_hover,
            "highlight-header-skills": self.highlight_header_skills,
            "highlight-header-todos": self.highlight_header_todos,
            "text-muted": self.text_muted,
        }
        return {**base, **self.extras}


# Builder functions (curried for composition)

def _dark_theme_vars(palette: ColorPalette) -> ThemeVariables:
    """Build dark theme variables from palette."""
    return ThemeVariables(
        primary=palette.green,
        secondary=palette.cyan,
        accent=palette.red,
        warning=palette.orange,
        error=palette.red,
        success=palette.green,
        foreground=palette.text,
        background=palette.bg0,
        surface=palette.bg1,
        panel=palette.bg2,
        dark=True,
        teal=palette.teal,
        highlight_cursor=palette.bg3,
        highlight_cursor_text=palette.green,
        highlight_hover=palette.bg2,
        highlight_header_skills=palette.green,
        highlight_header_todos=palette.red,
        text_muted=palette.muted,
    )


def _light_theme_vars(palette: ColorPalette) -> ThemeVariables:
    """Build light theme variables from palette."""
    return ThemeVariables(
        primary="#00c896",
        secondary="#00a8c0",
        accent="#e6005c",
        warning="#f59e0b",
        error="#e6005c",
        success="#00c896",
        foreground="#1a2332",
        background="#f5f7fa",
        surface="#ffffff",
        panel="#e8ecf0",
        dark=False,
        teal="#00b894",
        highlight_cursor="#d0d8e0",
        highlight_cursor_text="#00a878",
        highlight_hover="#e8ecf0",
        highlight_header_skills="#00a878",
        highlight_header_todos="#d6004f",
        text_muted="#708090",
    )


def override_vars(
    base: ThemeVariables,
    **overrides: HexColor
) -> ThemeVariables:
    """Override specific variables in a theme (functional update)."""
    return ThemeVariables(
        primary=overrides.get("primary", base.primary),
        secondary=overrides.get("secondary", base.secondary),
        accent=overrides.get("accent", base.accent),
        warning=overrides.get("warning", base.warning),
        error=overrides.get("error", base.error),
        success=overrides.get("success", base.success),
        foreground=overrides.get("foreground", base.foreground),
        background=overrides.get("background", base.background),
        surface=overrides.get("surface", base.surface),
        panel=overrides.get("panel", base.panel),
        dark=overrides.get("dark", base.dark),
        teal=overrides.get("teal", base.teal),
        highlight_cursor=overrides.get("highlight_cursor", base.highlight_cursor),
        highlight_cursor_text=overrides.get("highlight_cursor_text", base.highlight_cursor_text),
        highlight_hover=overrides.get("highlight_hover", base.highlight_hover),
        highlight_header_skills=overrides.get("highlight_header_skills", base.highlight_header_skills),
        highlight_header_todos=overrides.get("highlight_header_todos", base.highlight_header_todos),
        text_muted=overrides.get("text_muted", base.text_muted),
        extras={**base.extras, **overrides},
    )


def compose_themes(
    *themes: ThemeVariables,
) -> dict[str, HexColor]:
    """Compose multiple themes (later themes override earlier)."""
    result: dict[str, HexColor] = {}
    for theme in themes:
        result.update(theme.to_dict())
    return result


# =============================================================================
# Theme Creation Factories
# =============================================================================

def create_gits_theme(
    name: str,
    palette: ColorPalette = GITS_PALETTE,
    dark: bool = True,
    custom_overrides: dict[str, HexColor] | None = None,
) -> dict[str, HexColor]:
    """Create a GITS theme with optional customizations.
    
    Args:
        name: Theme name
        palette: Color palette to use
        dark: Whether this is a dark theme
        custom_overrides: Optional overrides for specific colors
    
    Returns:
        Dictionary of theme variables ready for Textual
    """
    # Build base variables
    base_vars = _dark_theme_vars(palette) if dark else _light_theme_vars(palette)
    
    # Apply custom overrides if provided
    if custom_overrides:
        final_vars = override_vars(base_vars, **custom_overrides)
    else:
        final_vars = base_vars
    
    # Add theme name
    result = final_vars.to_dict()
    result["_name"] = name  # Internal marker
    
    return result


# Pre-defined themes
GITS_DARK_VARS = create_gits_theme("gits-dark", dark=True)
GITS_LIGHT_VARS = create_gits_theme("gits-light", dark=False)


# =============================================================================
# CSS Generation (Functional)
# =============================================================================

def css_var(name: str) -> str:
    """Reference a CSS variable."""
    return f"${name}"


def css_value(color: HexColor) -> str:
    """Quote a color value for CSS."""
    return color


# Common CSS patterns as functions

def panel_css(
    panel_id: str,
    border_color: str,
    header_color: str,
) -> str:
    """Generate panel CSS."""
    return f"""
{panel_id}-container {{
    width: 100%;
    height: 100%;
    border: solid {border_color};
    background: $surface;
}}

{panel_id}-header {{
    background: {header_color};
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

{panel_id}-container:focus {{
    border: solid $accent;
}}
"""


# Pre-defined panel styles
SESSION_TREE_CSS = panel_css("#session-tree", "$primary", "$primary")
DETAILS_CSS = panel_css("#details", "$secondary", "$secondary")
TOKENS_CSS = panel_css("#tokens", "$teal", "$teal")
SKILLS_CSS = panel_css("#skills", "$primary", "$primary")
TODOS_CSS = panel_css("#todos", "$error", "$error")


def datatable_css(
    widget_name: str,
    header_color_var: str = "$primary",
) -> str:
    """Generate DataTable CSS."""
    return f"""
{widget_name} {{
    background: $surface;
    color: $text;
    border: none;
    height: 100%;
}}

{widget_name} > .datatable--header {{
    background: $panel;
    color: {header_color_var};
    text-style: bold;
}}

{widget_name} > .datatable--cursor {{
    background: $highlight-cursor;
    color: $text;
}}

{widget_name} > .datatable--hover {{
    background: $highlight-hover;
}}

{widget_name}:focus .datatable--cursor {{
    background: $highlight-cursor;
    color: $highlight-cursor-text;
}}
"""


SKILLS_TABLE_CSS = datatable_css("SkillsDataTable", "$highlight-header-skills")
TODOS_TABLE_CSS = datatable_css("TodosDataTable", "$highlight-header-todos")


# =============================================================================
# Legacy Compatibility (THEME object)
# =============================================================================

# For backward compatibility, expose the palette as THEME
THEME = GITS_PALETTE


# =============================================================================
# Textual Theme Integration
# =============================================================================

from textual.theme import Theme as TextualTheme


def build_textual_theme(
    name: str,
    variables: dict[str, HexColor],
    dark: bool = True,
    luminosity_spread: float = 0.15,
) -> TextualTheme:
    """Build a Textual Theme object from our variables."""
    return TextualTheme(
        name=name,
        primary=variables.get("primary", "#00ff9f"),
        secondary=variables.get("secondary", "#26c6da"),
        accent=variables.get("accent", "#ff0066"),
        warning=variables.get("warning", "#ffa726"),
        error=variables.get("error", "#ff0066"),
        success=variables.get("success", "#00ff9f"),
        foreground=variables.get("foreground", "#b3e5fc"),
        background=variables.get("background", "#0a0e14"),
        surface=variables.get("surface", "#0d1117"),
        panel=variables.get("panel", "#13171f"),
        dark=dark,
        luminosity_spread=luminosity_spread,
        variables=variables,
    )


# Pre-built Textual themes
TEXTUAL_THEME = build_textual_theme("gits-dark", GITS_DARK_VARS, dark=True)
TEXTUAL_THEME_LIGHT = build_textual_theme("gits-light", GITS_LIGHT_VARS, dark=False)


# =============================================================================
# CSS Export (consolidated for dashboard)
# =============================================================================

DASHBOARD_CSS = """
/* =============================================================================
 * Main Screen Styles
 * ============================================================================= */
Screen {
    background: $background;
    scrollbar-size-vertical: 1;
    scrollbar-size-horizontal: 1;
}

ScrollableContainer {
    scrollbar-size-vertical: 1;
    scrollbar-size-horizontal: 1;
    scrollbar-background: $surface;
    scrollbar-color: $panel;
}

ScrollableContainer:hover {
    scrollbar-color: $secondary;
}

RichLog {
    scrollbar-size-vertical: 1;
    scrollbar-size-horizontal: 1;
    scrollbar-background: $surface;
    scrollbar-color: $panel;
}

RichLog:hover {
    scrollbar-color: $secondary;
}

/* =============================================================================
 * Layout Styles
 * ============================================================================= */
#main-grid {
    layout: grid;
    grid-size: 2;
    grid-gutter: 0;
    grid-columns: 1fr 1fr;
    height: 1fr;
}

#left-panel {
    width: 100%;
    height: 100%;
    layout: grid;
    grid-size: 1;
    grid-rows: 3fr 1fr;
    grid-gutter: 0;
    column-span: 1;
}

#right-panel {
    width: 100%;
    height: 100%;
    layout: grid;
    grid-size: 1;
    grid-rows: 1fr 1fr 1fr 1fr;
    grid-gutter: 0;
    column-span: 1;
}

#activity-bar {
    width: 100%;
    height: auto;
    background: $surface;
    padding: 0 1;
}

/* =============================================================================
 * Session Tree Styles (GITS: Green primary)
 * ============================================================================= */
#session-tree-container {
    width: 100%;
    height: 100%;
    border: solid $primary;
    background: $surface;
}

#session-tree-title {
    background: $primary;
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}

SessionTreeWidget {
    height: 100%;
    overflow-y: auto;
}

#session-tree-container:focus {
    border: solid $accent;
}

SessionTreeWidget > .tree--guides {
    color: $text-muted;
}

SessionTreeWidget > .tree--guides-selected {
    color: $accent;
}

SessionTreeWidget > .tree--guides-hover {
    color: $secondary;
}

SessionTreeWidget:focus .tree--cursor {
    background: $highlight-cursor;
}

SessionTreeWidget .tree--highlight-line {
    background: $highlight-hover;
}

/* =============================================================================
 * Details Panel Styles (GITS: Cyan secondary)
 * ============================================================================= */
#details-container {
    width: 100%;
    height: 100%;
    border: solid $secondary;
    background: $surface;
}

#details-header {
    background: $secondary;
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}

#details {
    padding: 1;
    color: $text;
    overflow-y: auto;
    height: 100%;
}

#details-container:focus {
    border: solid $accent;
}

/* =============================================================================
 * Tokens Panel Styles (GITS: Teal tertiary)
 * ============================================================================= */
#tokens-container {
    width: 100%;
    height: 100%;
    border: solid $teal;
    background: $surface;
}

#tokens-scroll {
    height: 1fr;
    overflow-y: auto;
}

#tokens-header {
    background: $teal;
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}

#tokens-content {
    padding: 1;
    color: $text;
    height: 100%;
}

#tokens-content RichLog {
    background: $surface;
    color: $text;
}

#tokens-container:focus {
    border: solid $accent;
}

/* =============================================================================
 * Skills Panel Styles (GITS: Green primary)
 * ============================================================================= */
#skills-container {
    width: 100%;
    height: 100%;
    border: solid $primary;
    background: $surface;
}

#skills-scroll {
    height: 1fr;
    overflow-y: auto;
}

#skills-header {
    background: $primary;
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}

#skills-container:focus {
    border: solid $accent;
}

/* =============================================================================
 * Todos Panel Styles (GITS: Red accent)
 * ============================================================================= */
#todos-container {
    width: 100%;
    height: 100%;
    border: solid $error;
    background: $surface;
}

#todos-scroll {
    height: 1fr;
    overflow-y: auto;
}

#todos-header {
    background: $error;
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}

#todos-container:focus {
    border: solid $error;
}

/* =============================================================================
 * Search Bar Styles
 * ============================================================================= */
#search-container {
    width: 100%;
    height: auto;
    background: $panel;
    padding: 0 1;
    display: none;
}

#search-container.visible {
    display: block;
}

#search-input {
    width: 1fr;
    background: $surface;
    color: $text;
    border: solid $secondary;
    padding: 0 1;
}

#search-input:focus {
    border: solid $accent;
}

#search-hint {
    color: $text-muted;
    text-style: italic;
    padding: 0 1;
}

/* =============================================================================
 * Aggregation Bar Styles
 * ============================================================================= */
#aggregation {
    width: 100%;
    height: auto;
    border: solid $panel;
    padding: 1;
    color: $text;
}

/* =============================================================================
 * Footer Styles
 * ============================================================================= */
#footer-bar {
    background: $background;
    color: $text-muted;
    height: auto;
    padding: 0 1;
    text-align: center;
}

/* =============================================================================
 * Error Details Panel Styles
 * ============================================================================= */
#error-details-container {
    width: 100%;
    height: 100%;
    border: solid $error;
    background: $surface;
}

#error-details-container.hidden {
    display: none;
}

#error-scroll {
    height: 1fr;
    overflow-y: auto;
}

#error-header {
    background: $error;
    color: $background;
    padding: 0 1;
    text-style: bold;
    height: 1;
}

#error-details-content {
    padding: 1;
    color: $text;
    height: 100%;
}

#error-details-content RichLog {
    background: $surface;
    color: $text;
}

/* =============================================================================
 * Collapsible Styles
 * ============================================================================= */
Collapsible {
    width: 1fr;
    height: auto;
    background: $surface;
    border-top: solid $panel;
    padding-bottom: 1;
    padding-left: 1;
}

Collapsible:focus-within {
    border-left: solid $primary;
}

Collapsible > Contents {
    width: 100%;
    height: auto;
    padding: 1 0 0 3;
}

/* =============================================================================
 * DataTable Styles (Standardized)
 * ============================================================================= */
SkillsDataTable {
    background: $surface;
    color: $text;
    border: none;
    height: 100%;
}

SkillsDataTable > .datatable--header {
    background: $panel;
    color: $highlight-header-skills;
    text-style: bold;
}

SkillsDataTable > .datatable--cursor {
    background: $highlight-cursor;
    color: $text;
}

SkillsDataTable > .datatable--hover {
    background: $highlight-hover;
}

SkillsDataTable:focus .datatable--cursor {
    background: $highlight-cursor;
    color: $highlight-cursor-text;
}

TodosDataTable {
    background: $surface;
    color: $text;
    border: none;
    height: 100%;
}

TodosDataTable > .datatable--header {
    background: $panel;
    color: $highlight-header-todos;
    text-style: bold;
}

TodosDataTable > .datatable--cursor {
    background: $highlight-cursor;
    color: $text;
}

TodosDataTable > .datatable--hover {
    background: $highlight-hover;
}

TodosDataTable:focus .datatable--cursor {
    background: $highlight-cursor;
    color: $highlight-cursor-text;
}
"""


# =============================================================================
# Convenience Lookups
# =============================================================================

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
    "tree": THEME.green,
    "details": THEME.cyan,
    "skills": THEME.green,
    "todos": THEME.red,
    "aggregation": THEME.muted,
}


# =============================================================================
# Helper Functions
# =============================================================================

def register_themes(app) -> None:
    """Register GITS themes with a Textual App."""
    app.register_theme(TEXTUAL_THEME)
    app.register_theme(TEXTUAL_THEME_LIGHT)
