#!/usr/bin/env python3
"""
Smoke Test Framework for Tachikoma Scripts

Validates that scripts (Python, Shell, etc.) remain functional after refactoring.

Usage:
    python smoke_test.py                    # Run all tests
    python smoke_test.py --type python      # Test Python scripts only
    python smoke_test.py --type shell       # Test Shell scripts only
    python smoke_test.py --file path/to/script.py  # Test specific file
    python smoke_test.py --fail-fast        # Stop on first failure
    python smoke_test.py --json             # Output JSON format
"""

import argparse
import ast
import json
import os
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple


class TestStatus(Enum):
    """Test status enumeration"""

    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARN = "WARN"


@dataclass
class TestResult:
    """Result of a single test"""

    name: str
    status: TestStatus
    message: str
    duration_ms: float = 0.0
    details: Optional[Dict[str, Any]] = None

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON output"""
        result = asdict(self)
        result["status"] = self.status.value
        return result


@dataclass
class ScriptTestResult:
    """Result of testing a single script"""

    script_path: str
    script_type: str
    tests: List[TestResult]
    overall_status: TestStatus
    duration_ms: float = 0.0

    def add_test(self, test: TestResult):
        """Add a test result"""
        self.tests.append(test)
        self._update_overall_status()

    def _update_overall_status(self):
        """Update overall status based on tests"""
        if any(t.status == TestStatus.FAIL for t in self.tests):
            self.overall_status = TestStatus.FAIL
        elif any(t.status == TestStatus.WARN for t in self.tests):
            self.overall_status = TestStatus.WARN
        elif not self.tests:
            self.overall_status = TestStatus.SKIP
        else:
            self.overall_status = TestStatus.PASS

    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON output"""
        return {
            "script_path": self.script_path,
            "script_type": self.script_type,
            "overall_status": self.overall_status.value,
            "duration_ms": self.duration_ms,
            "tests": [t.to_dict() for t in self.tests],
        }


class SmokeTestFramework:
    """Main smoke test framework"""

    def __init__(
        self,
        base_dir: str = ".opencode",
        fail_fast: bool = False,
        verbose: bool = False,
    ):
        """
        Initialize smoke test framework

        Args:
            base_dir: Base directory to search for scripts
            fail_fast: Stop on first failure
            verbose: Enable verbose output
        """
        self.base_dir = Path(base_dir)
        self.fail_fast = fail_fast
        self.verbose = verbose
        self.results: List[ScriptTestResult] = []

        # Define script patterns
        self.python_patterns = ["*.py"]
        self.shell_patterns = ["*.sh", "*.bash"]

        # Directories to exclude
        self.exclude_dirs = {
            "node_modules",
            "__pycache__",
            ".git",
            "venv",
            "env",
            ".venv",
            "dist",
            "build",
        }

        # Specific files to exclude (rarely changed, manually tested, or cause issues)
        self.exclude_files = {"tachikoma-install.sh", "run-smoke-tests.sh"}

    def discover_scripts(
        self, script_type: Optional[str] = None, specific_file: Optional[str] = None
    ) -> List[Path]:
        """
        Discover scripts to test

        Args:
            script_type: Filter by script type ('python', 'shell', or None for all)
            specific_file: Test specific file only

        Returns:
            List of script paths
        """
        if specific_file:
            specific_path = Path(specific_file)
            if specific_path.exists():
                return [specific_path]
            return []

        scripts = []

        if script_type in (None, "python"):
            scripts.extend(self._find_files(self.python_patterns))

        if script_type in (None, "shell"):
            scripts.extend(self._find_files(self.shell_patterns))

        return sorted(set(scripts))

    def _find_files(self, patterns: List[str]) -> List[Path]:
        """Find files matching patterns, excluding certain directories"""
        files = []

        for pattern in patterns:
            for path in self.base_dir.rglob(pattern):
                # Skip excluded directories
                if any(excl in path.parts for excl in self.exclude_dirs):
                    continue

                # Skip excluded files
                if path.name in self.exclude_files:
                    continue

                # Skip non-files
                if not path.is_file():
                    continue

                files.append(path)

        return files

    def test_script(self, script_path: Path) -> ScriptTestResult:
        """
        Test a single script

        Args:
            script_path: Path to script

        Returns:
            ScriptTestResult with test results
        """
        script_type = self._get_script_type(script_path)
        result = ScriptTestResult(
            script_path=str(script_path),
            script_type=script_type,
            tests=[],
            overall_status=TestStatus.PASS,
        )

        self._print(f"\n{'=' * 60}")
        self._print(f"Testing: {script_path}")
        self._print(f"Type: {script_type}")
        self._print(f"{'=' * 60}")

        if script_type == "python":
            self._test_python_script(script_path, result)
        elif script_type == "shell":
            self._test_shell_script(script_path, result)
        else:
            result.add_test(
                TestResult(
                    name="script_type",
                    status=TestStatus.SKIP,
                    message=f"Unknown script type: {script_type}",
                )
            )

        return result

    def _get_script_type(self, script_path: Path) -> str:
        """Determine script type from extension"""
        suffix = script_path.suffix.lower()
        if suffix == ".py":
            return "python"
        elif suffix in (".sh", ".bash"):
            return "shell"
        else:
            return "unknown"

    def _test_python_script(self, script_path: Path, result: ScriptTestResult):
        """Test Python script"""
        import py_compile

        # Test 1: Syntax check
        test_start = time.time()
        try:
            py_compile.compile(str(script_path), doraise=True)
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.PASS,
                    message="Python syntax is valid",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
        except py_compile.PyCompileError as e:
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.FAIL,
                    message=f"Syntax error: {str(e)}",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
            if self.fail_fast:
                return

        # Test 2: Import check
        test_start = time.time()
        imports_ok, import_msg = self._check_python_imports(script_path)
        result.add_test(
            TestResult(
                name="imports",
                status=TestStatus.PASS if imports_ok else TestStatus.WARN,
                message=import_msg,
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

        # Test 3: Shebang check
        test_start = time.time()
        first_line = script_path.read_text(encoding="utf-8", errors="ignore").split(
            "\n"
        )[0]
        has_shebang = first_line.startswith("#!")
        result.add_test(
            TestResult(
                name="shebang",
                status=TestStatus.PASS if has_shebang else TestStatus.WARN,
                message="Has shebang" if has_shebang else "Missing shebang line",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

        # Test 4: CLI interface check (if main block exists)
        test_start = time.time()
        has_cli = self._check_python_cli(script_path)
        result.add_test(
            TestResult(
                name="cli_interface",
                status=TestStatus.PASS if has_cli else TestStatus.SKIP,
                message="Has CLI interface"
                if has_cli
                else "No CLI interface (optional)",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

        # Test 5: Basic execution (if has CLI)
        test_start = time.time()
        if has_cli:
            exec_ok, exec_msg = self._test_python_execution(script_path)
            result.add_test(
                TestResult(
                    name="execution",
                    status=TestStatus.PASS if exec_ok else TestStatus.WARN,
                    message=exec_msg,
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )

    def _check_python_imports(self, script_path: Path) -> Tuple[bool, str]:
        """Check if Python imports are available"""
        try:
            content = script_path.read_text(encoding="utf-8")
            tree = ast.parse(content)

            # Extract imports
            imports = set()
            for node in ast.walk(tree):
                if isinstance(node, ast.Import):
                    for alias in node.names:
                        imports.add(alias.name.split(".")[0])
                elif isinstance(node, ast.ImportFrom):
                    if node.module:
                        imports.add(node.module.split(".")[0])

            # Standard library modules
            stdlib = {
                "os",
                "sys",
                "re",
                "json",
                "time",
                "datetime",
                "pathlib",
                "collections",
                "itertools",
                "functools",
                "typing",
                "dataclasses",
                "enum",
                "argparse",
                "subprocess",
                "io",
                "pickle",
                "logging",
            }

            # Check external imports
            external = imports - stdlib
            if not external:
                return True, "No external imports"

            missing = []
            for imp in external:
                try:
                    __import__(imp)
                except ImportError:
                    missing.append(imp)

            if missing:
                return False, f"Missing imports: {', '.join(missing)}"
            else:
                return True, "All imports available"

        except Exception as e:
            return False, f"Import check failed: {str(e)}"

    def _check_python_cli(self, script_path: Path) -> bool:
        """Check if Python script has CLI interface"""
        try:
            content = script_path.read_text(encoding="utf-8")
            tree = ast.parse(content)

            # Check for if __name__ == '__main__' block
            for node in ast.walk(tree):
                if isinstance(node, ast.If):
                    # Check if test is __name__ == '__main__'
                    if (
                        isinstance(node.test, ast.Compare)
                        and isinstance(node.test.left, ast.Name)
                        and node.test.left.id == "__name__"
                        and isinstance(node.test.comparators[0], ast.Constant)
                        and node.test.comparators[0].value == "__main__"
                    ):
                        return True

            return False

        except Exception:
            return False

    def _test_python_execution(self, script_path: Path) -> Tuple[bool, str]:
        """Test basic Python script execution (with --help if available)"""
        try:
            # Try running with --help
            proc = subprocess.run(
                [sys.executable, str(script_path), "--help"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
            )

            if proc.returncode == 0:
                return True, "Help command works"
            else:
                # Try without arguments
                proc = subprocess.run(
                    [sys.executable, str(script_path)],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=10,
                )
                if proc.returncode == 0:
                    return True, "Script runs without errors"
                else:
                    return False, f"Execution error: {proc.stderr[:100]}"

        except subprocess.TimeoutExpired:
            return False, "Script timed out"
        except Exception as e:
            return False, f"Execution failed: {str(e)}"

    def _test_shell_script(self, script_path: Path, result: ScriptTestResult):
        """Test shell script"""

        # Test 1: Shebang check
        test_start = time.time()
        first_line = script_path.read_text(encoding="utf-8", errors="ignore").split(
            "\n"
        )[0]
        has_shebang = first_line.startswith("#!")
        result.add_test(
            TestResult(
                name="shebang",
                status=TestStatus.PASS if has_shebang else TestStatus.FAIL,
                message="Has shebang" if has_shebang else "Missing shebang line",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

        if not has_shebang and self.fail_fast:
            return

        # Test 2: Basic syntax (bash -n)
        test_start = time.time()
        try:
            proc = subprocess.run(
                ["bash", "-n", str(script_path)],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
            )

            if proc.returncode == 0:
                result.add_test(
                    TestResult(
                        name="syntax",
                        status=TestStatus.PASS,
                        message="Shell syntax is valid",
                        duration_ms=(time.time() - test_start) * 1000,
                    )
                )
            else:
                result.add_test(
                    TestResult(
                        name="syntax",
                        status=TestStatus.FAIL,
                        message=f"Syntax error: {proc.stderr[:100]}",
                        duration_ms=(time.time() - test_start) * 1000,
                    )
                )
                if self.fail_fast:
                    return

        except subprocess.TimeoutExpired:
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.WARN,
                    message="Syntax check timed out",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
        except FileNotFoundError:
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.WARN,
                    message="bash not found, skipping syntax check",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
        except Exception as e:
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.WARN,
                    message=f"Syntax check failed: {str(e)}",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )

        # Test 3: Executable check
        test_start = time.time()
        is_executable = os.access(script_path, os.X_OK)
        result.add_test(
            TestResult(
                name="executable",
                status=TestStatus.PASS if is_executable else TestStatus.WARN,
                message="Is executable"
                if is_executable
                else "Not executable (may not need to be)",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

        # Test 4: Help command (common pattern in router scripts)
        test_start = time.time()
        help_ok, help_msg = self._test_shell_help(script_path)
        result.add_test(
            TestResult(
                name="help_command",
                status=TestStatus.PASS if help_ok else TestStatus.WARN,
                message=help_msg,
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

        # Test 5: Basic execution
        test_start = time.time()
        exec_ok, exec_msg = self._test_shell_execution(script_path)
        result.add_test(
            TestResult(
                name="execution",
                status=TestStatus.PASS if exec_ok else TestStatus.WARN,
                message=exec_msg,
                duration_ms=(time.time() - test_start) * 1000,
            )
        )

    def _test_shell_help(self, script_path: Path) -> Tuple[bool, str]:
        """Test shell script help command"""
        try:
            # Try running with help
            proc = subprocess.run(
                ["bash", str(script_path), "help"],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
            )

            if proc.returncode == 0:
                return True, "Help command works"

            # Try -h, --help
            for arg in ["-h", "--help"]:
                proc = subprocess.run(
                    ["bash", str(script_path), arg],
                    capture_output=True,
                    text=True,
                    encoding="utf-8",
                    errors="replace",
                    timeout=10,
                )
                if proc.returncode == 0:
                    return True, f"Help command works (with {arg})"

            return False, "No help command found (optional)"

        except subprocess.TimeoutExpired:
            return False, "Help command timed out"
        except Exception as e:
            return False, f"Help check failed: {str(e)}"

    def _test_shell_execution(self, script_path: Path) -> Tuple[bool, str]:
        """Test basic shell script execution"""
        try:
            # Try running without arguments (may show help or status)
            proc = subprocess.run(
                ["bash", str(script_path)],
                capture_output=True,
                text=True,
                encoding="utf-8",
                errors="replace",
                timeout=10,
            )

            if proc.returncode == 0:
                return True, "Script runs without errors"
            else:
                return (
                    False,
                    f"Execution error (exit {proc.returncode}): {proc.stderr[:100]}",
                )

        except subprocess.TimeoutExpired:
            return False, "Script timed out"
        except Exception as e:
            return False, f"Execution failed: {str(e)}"

    def run_all_tests(
        self, script_type: Optional[str] = None, specific_file: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Run all smoke tests

        Args:
            script_type: Filter by script type
            specific_file: Test specific file only

        Returns:
            Summary dictionary
        """
        import time

        start_time = time.time()

        # Discover scripts
        scripts = self.discover_scripts(script_type, specific_file)

        if not scripts:
            self._print("No scripts found to test!")
            return {
                "total_scripts": 0,
                "passed": 0,
                "failed": 0,
                "warned": 0,
                "skipped": 0,
                "results": [],
                "duration_ms": (time.time() - start_time) * 1000,
            }

        self._print(f"\nFound {len(scripts)} scripts to test")

        # Test each script
        for script in scripts:
            result = self.test_script(script)
            self.results.append(result)

            # Stop on failure if fail_fast
            if self.fail_fast and result.overall_status == TestStatus.FAIL:
                self._print("\n[FAIL] Stopping due to failure (fail-fast mode)")
                break

        # Generate summary
        total = len(self.results)
        passed = sum(1 for r in self.results if r.overall_status == TestStatus.PASS)
        failed = sum(1 for r in self.results if r.overall_status == TestStatus.FAIL)
        warned = sum(1 for r in self.results if r.overall_status == TestStatus.WARN)
        skipped = sum(1 for r in self.results if r.overall_status == TestStatus.SKIP)

        summary = {
            "total_scripts": total,
            "passed": passed,
            "failed": failed,
            "warned": warned,
            "skipped": skipped,
            "results": [r.to_dict() for r in self.results],
            "duration_ms": (time.time() - start_time) * 1000,
        }

        return summary

    def print_summary(self, summary: Dict[str, Any]):
        """Print test summary"""
        self._print(f"\n{'=' * 60}")
        self._print("SMOKE TEST SUMMARY")
        self._print(f"{'=' * 60}")
        self._print(f"Total scripts tested: {summary['total_scripts']}")
        self._print(f"Passed: {summary['passed']}")
        self._print(f"Failed: {summary['failed']}")
        self._print(f"Warnings: {summary['warned']}")
        self._print(f"Skipped: {summary['skipped']}")
        self._print(f"Duration: {summary['duration_ms']:.2f}ms")
        self._print(f"{'=' * 60}")

        # Print failures
        if summary["failed"] > 0:
            self._print("\n[FAIL] Failed scripts:")
            for result in summary["results"]:
                if result["overall_status"] == "FAIL":
                    self._print(f"  - {result['script_path']}")
                    failed_tests = [t for t in result["tests"] if t["status"] == "FAIL"]
                    for test in failed_tests:
                        self._print(f"      {test['name']}: {test['message']}")

        # Print warnings
        if summary["warned"] > 0:
            self._print("\n[WARN] Scripts with warnings:")
            for result in summary["results"]:
                if result["overall_status"] == "WARN":
                    self._print(f"  - {result['script_path']}")
                    warned_tests = [t for t in result["tests"] if t["status"] == "WARN"]
                    for test in warned_tests:
                        self._print(f"      {test['name']}: {test['message']}")

        # Exit code
        if summary["failed"] > 0:
            self._print("\n[FAIL] Some tests failed!")
            sys.exit(1)
        elif summary["warned"] > 0:
            self._print("\n[WARN] Some tests passed with warnings")
            sys.exit(0)
        else:
            self._print("\n[PASS] All tests passed!")
            sys.exit(0)

    def _print(self, message: str):
        """Print message if verbose or always print important messages"""
        # Always print messages (can add verbose check later)
        print(message)


def main():
    """Main entry point"""
    parser = argparse.ArgumentParser(
        description="Smoke Test Framework for Tachikoma Scripts"
    )

    parser.add_argument(
        "--type", choices=["python", "shell"], help="Filter by script type"
    )
    parser.add_argument("--file", help="Test specific file")
    parser.add_argument(
        "--fail-fast", action="store_true", help="Stop on first failure"
    )
    parser.add_argument("--json", action="store_true", help="Output JSON format")
    parser.add_argument("--verbose", action="store_true", help="Verbose output")

    args = parser.parse_args()

    # Create framework
    framework = SmokeTestFramework(
        base_dir=".opencode", fail_fast=args.fail_fast, verbose=args.verbose
    )

    # Run tests
    summary = framework.run_all_tests(script_type=args.type, specific_file=args.file)

    # Output results
    if args.json:
        print(json.dumps(summary, indent=2))
    else:
        framework.print_summary(summary)


if __name__ == "__main__":
    main()
