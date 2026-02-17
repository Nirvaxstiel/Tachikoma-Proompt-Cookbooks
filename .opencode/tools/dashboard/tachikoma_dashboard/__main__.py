"""CLI entry point for the Tachikoma dashboard."""

import argparse
import sys
import json

from .app import DashboardApp
from . import db


def main() -> int:
    """Main entry point."""
    parser = argparse.ArgumentParser(
        prog="tachikoma dashboard",
        description="Real-time Tachikoma agent dashboard",
    )

    parser.add_argument(
        "--interval",
        "-i",
        type=int,
        default=2000,
        help="Refresh interval in milliseconds (default: 2000)",
    )

    parser.add_argument(
        "--cwd",
        "-c",
        type=str,
        default=None,
        help="Filter by working directory",
    )

    parser.add_argument(
        "--all-sessions",
        "-a",
        action="store_true",
        help="Show all sessions (not just current cwd)",
    )

    parser.add_argument(
        "--worktrees",
        "-w",
        action="store_true",
        help="Include worktree panel (not yet implemented)",
    )

    parser.add_argument(
        "--select",
        "-s",
        type=str,
        default=None,
        help="Select specific session on start",
    )

    parser.add_argument(
        "--json",
        "-j",
        action="store_true",
        help="One-shot JSON output (no TUI)",
    )

    args = parser.parse_args()

    if args.json:
        # One-shot JSON output
        sessions = db.get_sessions(args.cwd)
        print(
            json.dumps(
                [
                    {
                        "id": s.id,
                        "parent_id": s.parent_id,
                        "project_id": s.project_id,
                        "title": s.title,
                        "directory": s.directory,
                        "time_created": s.time_created,
                        "time_updated": s.time_updated,
                        "status": s.status.value,
                        "duration": s.duration,
                    }
                    for s in sessions
                ],
                indent=2,
            )
        )
        return 0

    # Run TUI
    app = DashboardApp(interval=args.interval, cwd=args.cwd)
    app.run()

    return 0


if __name__ == "__main__":
    sys.exit(main())
