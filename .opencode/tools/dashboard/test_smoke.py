"""
Smoke tests for Tachikoma Dashboard.

Quick validation that dashboard can start and query data,
including skill tracking from OpenCode's database.
"""

import json
import subprocess
import sys
from pathlib import Path

# Add dashboard to path
sys.path.insert(0, str(Path(__file__).parent))

from tachikoma_dashboard.db import (
    _db_path,
    get_session_by_id,
    get_session_skills,
    get_sessions,
    get_skill_usage_stats,
)


def run_dashboard_json() -> dict:
    """Run dashboard in JSON mode and return parsed output."""
    tools_dir = Path(__file__).parent.parent

    # Try .bat on Windows, .sh on Unix
    launcher = None
    for ext in [".bat", ""]:
        candidate = tools_dir / f"tachikoma-dashboard{ext}"
        if candidate.exists():
            launcher = candidate
            break

    if launcher is None:
        return {"error": f"No launcher found in {tools_dir}"}

    # Run with JSON output
    result = subprocess.run(
        [str(launcher), "--json"],
        capture_output=True,
        text=True,
        timeout=30,
    )

    if result.returncode != 0:
        return {"error": f"Exit code {result.returncode}", "stderr": result.stderr}

    try:
        data = json.loads(result.stdout)
        return {"success": True, "sessions": len(data), "data": data}
    except json.JSONDecodeError as e:
        return {"error": f"JSON parse failed: {e}", "stdout": result.stdout[:500]}


def test_json_output() -> bool:
    """Test that dashboard outputs valid JSON."""
    print("Testing JSON output...")
    result = run_dashboard_json()

    if "error" in result:
        print(f"  [X] FAILED: {result['error']}")
        if "stderr" in result:
            print(f"     stderr: {result['stderr'][:200]}")
        return False

    if result.get("sessions", 0) == 0:
        print("  [!] WARNING: No sessions found (is OpenCode running?)")

    print(f"  [+] OK: {result['sessions']} sessions")
    return True


def test_no_exceptions() -> bool:
    """Test that dashboard doesn't crash on startup."""
    print("Testing for exceptions...")
    result = run_dashboard_json()

    if "error" in result and "stderr" in result:
        stderr = result["stderr"].lower()
        if "traceback" in stderr or "exception" in stderr:
            print("  [X] FAILED: Exception detected")
            return False

    print("  [+] OK: No exceptions")
    return True


def test_database_connection() -> bool:
    """Test that we can connect to OpenCode database."""
    print("Testing database connection...")

    db_path = _db_path()
    if not db_path.exists():
        print(f"  [X] FAILED: Database not found at {db_path}")
        print("     Make sure OpenCode has been run and has created sessions.")
        return False

    print(f"  [+] OK: Database exists at {db_path}")
    return True


def test_session_queries() -> bool:
    """Test that we can query sessions from database."""
    print("Testing session queries...")

    try:
        sessions = get_sessions()
        print(f"  [+] OK: Found {len(sessions)} sessions")

        if len(sessions) > 0:
            # Test getting a specific session
            first_session = sessions[0]
            session = get_session_by_id(first_session.id)
            if session:
                print("  [+] OK: Can retrieve session by ID")
            else:
                print("  [X] FAILED: Cannot retrieve session by ID")
                return False

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        return False


def test_skill_tracking() -> bool:
    """Test skill tracking functionality."""
    print("Testing skill tracking...")

    try:
        # Test get_skill_usage_stats
        print("  Testing skill usage stats...")
        stats = get_skill_usage_stats()

        if stats:
            print(f"  [+] OK: Found stats for {len(stats)} skills")

            # Test get_session_skills for first session with skills
            sessions = get_sessions()
            found_skills = False

            for session in sessions:
                skills = get_session_skills(session.id)
                if skills:
                    found_skills = True
                    skill_names = [s.name for s in skills]
                    print(
                        f"  [+] OK: Session '{session.title[:30]}' has {len(skills)} skills: {', '.join(skill_names[:5])}"
                    )
                    break

            if not found_skills:
                print("  [!] WARNING: No sessions with skill invocations found")
                print("     This is OK if OpenCode hasn't been used with skills yet.")

            return True
        else:
            print("  [!] WARNING: No skill usage data found")
            print("     This is OK if no skills have been used yet.")
            return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def test_widget_imports() -> bool:
    """Test that dashboard widgets can be imported."""
    print("Testing widget imports...")

    try:
        # Import the modules - rich is required by widgets
        import sys
        from pathlib import Path

        # Add parent directory to path for imports
        parent_dir = Path(__file__).parent
        if str(parent_dir) not in sys.path:
            sys.path.insert(0, str(parent_dir))

        from tachikoma_dashboard.models import SessionStatus
        from tachikoma_dashboard.widgets import (
            get_status_icon,
            truncate_message,
        )

        print("  [+] OK: All widget functions importable")

        # Test a few functions
        icon, color = get_status_icon(SessionStatus.WORKING)
        msg = truncate_message("This is a test message")
        print("  [+] OK: Widget functions execute correctly")

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        import traceback

        traceback.print_exc()
        return False


def main():
    """Run all smoke tests."""
    print("=" * 50)
    print("Tachikoma Dashboard Smoke Tests")
    print("=" * 50)
    print()

    tests = [
        ("Database Connection", test_database_connection),
        ("Session Queries", test_session_queries),
        ("Skill Tracking", test_skill_tracking),
        ("Widget Imports", test_widget_imports),
        ("JSON Output", test_json_output),
        ("No Exceptions", test_no_exceptions),
    ]

    results = []
    for test_name, test_func in tests:
        try:
            result = test_func()
            results.append((test_name, "PASS" if result else "FAIL"))
        except Exception as e:
            print(f"  [X] {test_name} raised exception: {e}")
            results.append((test_name, "ERROR"))

    print()
    print("=" * 50)
    print("Test Results")
    print("=" * 50)

    for test_name, status in results:
        status_icon = "+" if status == "PASS" else "!"
        print(f"{status_icon} {test_name:20s} ... {status}")

    passed = sum(1 for _, status in results if status == "PASS")
    total = len(results)

    print()
    print("=" * 50)
    print(f"Summary: {passed}/{total} passed")
    print("=" * 50)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
