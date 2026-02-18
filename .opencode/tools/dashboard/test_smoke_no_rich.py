#!/usr/bin/env python3
"""
Smoke test for Tachikoma Dashboard (rich-independent version).

Validates dashboard functionality without requiring rich module.

Usage:
    python .opencode/tools/dashboard/test_smoke_no_rich.py
"""

import sys
import json
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from tachikoma_dashboard import db
from tachikoma_dashboard.models import Session, SessionTree, build_session_tree


def test_database_connection() -> bool:
    """Test that we can connect to OpenCode database."""
    print("Testing database connection...")

    db_path = db._db_path()
    if not db_path.exists():
        print("  [X] FAILED: Database not found")
        return False

    print(f"  [+] OK: Database exists at {db_path}")
    return True


def test_session_queries() -> bool:
    """Test that we can query sessions from database."""
    print("Testing session queries...")

    try:
        sessions = db.get_sessions()
        print(f"  [+] OK: Found {len(sessions)} sessions")

        if len(sessions) > 0:
            # Test getting a specific session
            first_session = sessions[0]
            session = db.get_session_by_id(first_session.id)
            if session:
                print(f"  [+] OK: Can retrieve session by ID")
            else:
                print(f"  [X] FAILED: Cannot retrieve session by ID")
                return False

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        return False


def test_session_tree_building() -> bool:
    """Test session tree building."""
    print("Testing session tree building...")

    try:
        sessions = db.get_sessions()
        trees = build_session_tree(sessions)

        print(f"  [+] OK: Built {len(trees)} root trees")

        # Test subagent detection
        subagent_count = sum(1 for t in trees if t.is_subagent)
        print(f"  [+] OK: Found {subagent_count} subagents")

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        return False


def test_skill_tracking() -> bool:
    """Test skill tracking functionality."""
    print("Testing skill tracking...")

    try:
        stats = db.get_skill_usage_stats()

        if stats:
            print(f"  [+] OK: Found stats for {len(stats)} skills")

            # Test session-specific skills
            sessions = db.get_sessions()
            if sessions:
                session = sessions[0]
                skills = db.get_session_skills(session.id)
                print(f"  [+] OK: Session '{session.title[:30]}...' has {len(skills)} skills")

            return True
        else:
            print("  [!] WARNING: No skill usage data found")
            return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_todos() -> bool:
    """Test todo queries."""
    print("Testing todo queries...")

    try:
        sessions = db.get_sessions()
        if not sessions:
            print("  [!] WARNING: No sessions found")
            return True

        # Test todos for first session
        session = sessions[0]
        todos = db.get_todos(session.id)
        print(f"  [+] OK: Found {len(todos)} todos for session")

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        return False


def test_json_output() -> bool:
    """Test JSON output mode."""
    print("Testing JSON output...")

    try:
        sessions = db.get_sessions()
        data = [
            {
                "id": s.id,
                "parent_id": s.parent_id,
                "title": s.title,
                "directory": s.directory,
                "status": s.status.value,
                "time_created": s.time_created,
                "time_updated": s.time_updated,
            }
            for s in sessions
        ]

        print(f"  [+] OK: JSON output for {len(sessions)} sessions")
        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        return False


def test_token_tracking() -> bool:
    """Test token tracking functionality."""
    print("Testing token tracking...")

    try:
        sessions = db.get_sessions()
        if not sessions:
            print("  [!] WARNING: No sessions found")
            return True

        # Test session tokens
        session = sessions[0]
        tokens = db.get_session_tokens(session.id)
        print(f"  [+] OK: Session has {tokens.total_tokens} tokens, {tokens.request_count} requests")
        print(f"  [+] OK: {len(tokens.models)} models used")

        # Test all model usage
        models = db.get_all_model_usage()
        print(f"  [+] OK: Found {len(models)} models with usage data")

        if models:
            top_model = models[0]
            print(f"  [+] OK: Top model: {top_model.provider}/{top_model.model} ({top_model.total_tokens} tokens)")

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_session_tree_widget() -> bool:
    """Test session tree widget."""
    print("Testing session tree widget...")

    try:
        from tachikoma_dashboard.session_tree import SessionTreeWidget
        from tachikoma_dashboard.models import build_session_tree

        sessions = db.get_sessions()
        trees = build_session_tree(sessions)

        # Create widget (without running app)
        widget = SessionTreeWidget("Sessions")
        widget.update_sessions(trees)

        print(f"  [+] OK: SessionTreeWidget created and populated")
        print(f"  [+] OK: Widget has {len(widget._session_map)} sessions mapped")

        return True

    except Exception as e:
        print(f"  [X] FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_widget_rendering() -> bool:
    """Test widget rendering functions."""
    print("Testing widget rendering...")

    try:
        from tachikoma_dashboard.widgets import (
            render_session_tokens,
            render_model_usage,
            render_details,
            render_skills,
            render_todos,
            render_aggregation,
        )
        from tachikoma_dashboard.models import SessionTokens, ModelUsage

        # Test token rendering
        tokens = db.get_session_tokens(db.get_sessions()[0].id) if db.get_sessions() else SessionTokens(session_id="test")
        rendered = render_session_tokens(tokens)
        if len(str(rendered)) == 0:
            print("  [X] FAILED: Token rendering empty")
            return False
        print(f"  [+] OK: Token rendering works")

        # Test model usage rendering
        models = db.get_all_model_usage()
        rendered = render_model_usage(models)
        if len(str(rendered)) == 0:
            print("  [X] FAILED: Model usage rendering empty")
            return False
        print(f"  [+] OK: Model usage rendering works")

        # Test details rendering
        sessions = db.get_sessions()
        if sessions:
            rendered = render_details(sessions[0])
            if len(str(rendered)) == 0:
                print("  [X] FAILED: Details rendering empty")
                return False
            print(f"  [+] OK: Details rendering works")

        # Test aggregation rendering
        rendered = render_aggregation(sessions)
        if len(str(rendered)) == 0:
            print("  [X] FAILED: Aggregation rendering empty")
            return False
        print(f"  [+] OK: Aggregation rendering works")

        return True

    except Exception as e:
        error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
        print(f"  [X] FAILED: {error_msg}")
        return False


def test_enhanced_widgets() -> bool:
    """Test enhanced widgets (DataTable, Sparkline, etc.)."""
    print("Testing enhanced widgets...")

    try:
        from tachikoma_dashboard.enhanced_widgets import (
            SkillsDataTable,
            TodosDataTable,
            ActivitySparkline,
            TodoProgressBar,
        )
        from tachikoma_dashboard.models import Skill, Todo

        # Test SkillsDataTable - can only test creation without app context
        skills_table = SkillsDataTable()
        print(f"  [+] OK: SkillsDataTable created")

        # Test TodosDataTable - can only test creation without app context
        todos_table = TodosDataTable()
        print(f"  [+] OK: TodosDataTable created")

        # Test ActivitySparkline
        sparkline = ActivitySparkline()
        sparkline.update_data([1.0, 2.0, 3.0, 2.0, 1.0])
        print(f"  [+] OK: ActivitySparkline created and updated")

        # Test TodoProgressBar
        progress = TodoProgressBar()
        progress.update_progress(3, 5)
        print(f"  [+] OK: TodoProgressBar created and updated")

        # Note: DataTable requires active app context to add columns/rows
        # Full testing is done when running the actual dashboard
        print(f"  [!] NOTE: DataTable full test requires running app")

        return True

    except Exception as e:
        error_msg = str(e).encode('ascii', errors='replace').decode('ascii')
        print(f"  [X] FAILED: {error_msg}")
        return False


def main():
    """Run all smoke tests."""
    print("=" * 70)
    print("TACHIKOMA DASHBOARD SMOKE TESTS (Rich-Independent)")
    print("=" * 70)
    print()

    tests = [
        ("Database Connection", test_database_connection),
        ("Session Queries", test_session_queries),
        ("Session Tree Building", test_session_tree_building),
        ("Skill Tracking", test_skill_tracking),
        ("Todo Queries", test_todos),
        ("JSON Output", test_json_output),
        ("Token Tracking", test_token_tracking),
        ("Session Tree Widget", test_session_tree_widget),
        ("Widget Rendering", test_widget_rendering),
        ("Enhanced Widgets", test_enhanced_widgets),
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
    print("=" * 70)
    print("Test Results")
    print("=" * 70)

    for test_name, status in results:
        status_char = "+" if status == "PASS" else "X"
        status_str = f"{status_char} {test_name:30s} ... {status}"
        
        # Windows-safe: print without encoding issues
        try:
            print(status_str)
        except UnicodeEncodeError:
            # Fallback to ASCII
            print(status_str.encode('ascii', errors='replace').decode('ascii'))
    
    passed = sum(1 for _, status in results if status == "PASS")
    total = len(results)

    print()
    print("=" * 70)
    print(f"Summary: {passed}/{total} passed")
    print("=" * 70)

    return 0 if passed == total else 1


if __name__ == "__main__":
    sys.exit(main())
