"""Tachikoma Dashboard - Real-time agent monitoring."""

__version__ = "0.1.0"

# Lazy imports to avoid requiring rich for basic operations
def get_app():
    """Lazy import DashboardApp."""
    from .app import DashboardApp
    return DashboardApp
