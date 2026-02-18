"""
Smoke tests for Tachikoma Dashboard.

Quick validation that the dashboard can start and query data.
"""

import json
import subprocess
import sys
from pathlib import Path


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
            print(f"  [X] FAILED: Exception detected")
            return False

    print("  [+] OK: No exceptions")
    return True


def main():
    """Run all smoke tests."""
    print("=" * 50)
    print("Tachikoma Dashboard Smoke Tests")
    print("=" * 50)
    print()

    tests = [
        test_json_output,
        test_no_exceptions,
    ]

    passed = sum(test() for test in tests)
    total = len(tests)

    print()
    print("=" * 50)
    print(f"Results: {passed}/{total} passed")
    print("=" * 50)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
