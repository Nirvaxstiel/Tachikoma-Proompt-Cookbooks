"""Dashboard CSS styles extracted for maintainability.

This module contains all CSS styles for the Tachikoma dashboard,
organized by component and using the GITS theme colors.

All panels follow a consistent structure:
- Container with colored border
- Header bar with accent color background
- Content area with padding
"""

from .theme import THEME

# =============================================================================
# Main Screen Styles
# =============================================================================

SCREEN_CSS = f"""
Screen {{
    background: {THEME.bg0};
    scrollbar-size-vertical: 1;
    scrollbar-size-horizontal: 1;
}}
"""

# =============================================================================
# Scrollable Container Styles (thin scrollbars)
# =============================================================================

SCROLLABLE_CSS = f"""
ScrollableContainer {{
    scrollbar-size-vertical: 1;
    scrollbar-size-horizontal: 1;
    scrollbar-background: {THEME.bg1};
    scrollbar-color: {THEME.bg3};
}}

ScrollableContainer:hover {{
    scrollbar-color: {THEME.cyan};
}}

/* RichLog styling - horizontal will be thin via custom renderer */
RichLog {{
    scrollbar-size-vertical: 1;
    scrollbar-size-horizontal: 1;
    scrollbar-background: {THEME.bg1};
    scrollbar-color: {THEME.bg3};
}}

RichLog:hover {{
    scrollbar-color: {THEME.cyan};
}}
"""

# =============================================================================
# Layout Styles
# =============================================================================

LAYOUT_CSS = f"""
#main-grid {{
    layout: grid;
    grid-size: 2;
    grid-gutter: 0;
    grid-columns: 1fr 1fr;
    height: 1fr;
}}

#left-panel {{
    width: 100%;
    height: 100%;
    layout: grid;
    grid-size: 1;
    grid-rows: 3fr 1fr;
    grid-gutter: 0;
    column-span: 1;
}}

#right-panel {{
    width: 100%;
    height: 100%;
    layout: grid;
    grid-size: 1;
    grid-rows: 1fr 1fr 1fr 1fr;
    grid-gutter: 0;
    column-span: 1;
}}

#activity-bar {{
    width: 100%;
    height: auto;
    background: {THEME.bg1};
    padding: 0 1;
}}
"""

# =============================================================================
# Common Panel Styles (shared by all panels)
# =============================================================================

PANEL_COMMON_CSS = f"""
/* Common panel container styles */
.panel-container {{
    width: 100%;
    height: 100%;
    background: {THEME.bg1};
    layout: vertical;
}}

/* Common header bar styles */
.panel-header {{
    padding: 0 1;
    text-style: bold;
    height: 1;
    color: {THEME.bg0};
}}

/* Common content area styles */
.panel-content {{
    padding: 1;
    color: {THEME.text};
    overflow-y: auto;
    height: 1fr;
}}
"""

# =============================================================================
# Session Tree Styles
# =============================================================================

SESSION_TREE_CSS = f"""
#session-tree-container {{
    width: 100%;
    height: 100%;
    border: solid {THEME.green};
    background: {THEME.bg1};
}}

#session-tree-title {{
    background: {THEME.green};
    color: {THEME.bg0};
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

SessionTreeWidget {{
    height: 100%;
    overflow-y: auto;
}}

#session-tree-container:focus {{
    border: solid {THEME.red};
}}
"""

# =============================================================================
# Details Panel Styles
# =============================================================================

DETAILS_CSS = f"""
#details-container {{
    width: 100%;
    height: 100%;
    border: solid {THEME.cyan};
    background: {THEME.bg1};
}}

#details-header {{
    background: {THEME.cyan};
    color: {THEME.bg0};
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

#details {{
    padding: 1;
    color: {THEME.text};
    overflow-y: auto;
    height: 100%;
}}

#details-container:focus {{
    border: solid {THEME.red};
}}
"""

# =============================================================================
# Tokens Panel Styles
# =============================================================================

TOKENS_CSS = f"""
#tokens-container {{
    width: 100%;
    height: 100%;
    border: solid {THEME.teal};
    background: {THEME.bg1};
}}

#tokens-scroll {{
    height: 1fr;
    overflow-y: auto;
}}

#tokens-header {{
    background: {THEME.teal};
    color: {THEME.bg0};
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

#tokens-content {{
    padding: 1;
    color: {THEME.text};
    height: 100%;
}}

#tokens-content RichLog {{
    background: {THEME.bg1};
    color: {THEME.text};
}}

#tokens-container:focus {{
    border: solid {THEME.red};
}}
"""

# =============================================================================
# Skills Panel Styles
# =============================================================================

SKILLS_CSS = f"""
#skills-container {{
    width: 100%;
    height: 100%;
    border: solid {THEME.orange};
    background: {THEME.bg1};
}}

#skills-scroll {{
    height: 1fr;
    overflow-y: auto;
}}

#skills-header {{
    background: {THEME.orange};
    color: {THEME.bg0};
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

#skills-container:focus {{
    border: solid {THEME.red};
}}
"""

# =============================================================================
# Todos Panel Styles
# =============================================================================

TODOS_CSS = f"""
#todos-container {{
    width: 100%;
    height: 100%;
    border: solid {THEME.red};
    background: {THEME.bg1};
}}

#todos-scroll {{
    height: 1fr;
    overflow-y: auto;
}}

#todos-header {{
    background: {THEME.red};
    color: {THEME.bg0};
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

#todos-container:focus {{
    border: solid {THEME.red};
}}
"""

# =============================================================================
# Search Bar Styles
# =============================================================================

SEARCH_CSS = f"""
#search-container {{
    width: 100%;
    height: auto;
    background: {THEME.bg2};
    padding: 0 1;
    display: none;
}}

#search-container.visible {{
    display: block;
}}

#search-input {{
    width: 1fr;
    background: {THEME.bg1};
    color: {THEME.text};
    border: solid {THEME.cyan};
    padding: 0 1;
}}

#search-input:focus {{
    border: solid {THEME.red};
}}

#search-hint {{
    color: {THEME.muted};
    text-style: italic;
    padding: 0 1;
}}
"""

# =============================================================================
# Aggregation Bar Styles
# =============================================================================

AGGREGATION_CSS = f"""
#aggregation {{
    width: 100%;
    height: auto;
    border: solid {THEME.muted};
    padding: 1;
    color: {THEME.text};
}}
"""

# =============================================================================
# Footer Styles
# =============================================================================

FOOTER_CSS = f"""
#footer-bar {{
    background: {THEME.bg0};
    color: {THEME.muted};
    height: auto;
    padding: 0 1;
    text-align: center;
}}
"""

# =============================================================================
# Error Details Panel Styles
# =============================================================================

ERROR_DETAILS_CSS = f"""
#error-details-container {{
    width: 100%;
    height: 100%;
    border: solid {THEME.error};
    background: {THEME.bg1};
}}

#error-details-container.hidden {{
    display: none;
}}

#error-scroll {{
    height: 1fr;
    overflow-y: auto;
}}

#error-header {{
    background: {THEME.error};
    color: {THEME.bg0};
    padding: 0 1;
    text-style: bold;
    height: 1;
}}

#error-details-content {{
    padding: 1;
    color: {THEME.text};
    height: 100%;
}}

#error-details-content RichLog {{
    background: {THEME.bg1};
    color: {THEME.text};
}}
"""

# =============================================================================
# Collapsible Styles
# =============================================================================

COLLAPSIBLE_CSS = f"""
Collapsible {{
    width: 1fr;
    height: auto;
    background: {THEME.bg1};
    border-top: solid {THEME.bg3};
    padding-bottom: 1;
    padding-left: 1;
}}

Collapsible:focus-within {{
    background-tint: {THEME.text} 5%;
}}

Collapsible > Contents {{
    width: 100%;
    height: auto;
    padding: 1 0 0 3;
}}
"""

# =============================================================================
# Combined CSS
# =============================================================================

DASHBOARD_CSS = (
    SCREEN_CSS
    + SCROLLABLE_CSS
    + LAYOUT_CSS
    + PANEL_COMMON_CSS
    + SESSION_TREE_CSS
    + DETAILS_CSS
    + TOKENS_CSS
    + ERROR_DETAILS_CSS
    + SKILLS_CSS
    + TODOS_CSS
    + SEARCH_CSS
    + AGGREGATION_CSS
    + FOOTER_CSS
    + COLLAPSIBLE_CSS
)
