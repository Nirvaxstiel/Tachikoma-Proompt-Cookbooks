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
import shutil
import subprocess
import sys
import time
from dataclasses import asdict, dataclass
from enum import Enum
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple, Union


# ===========================================================================
# Core Types (must be defined first)
# ===========================================================================
class TestStatus(Enum):
    """Test status enumeration"""

    PASS = "PASS"
    FAIL = "FAIL"
    SKIP = "SKIP"
    WARN = "WARN"


# ===========================================================================
# Ghost in the Shell Theme - Cyberpunk Aesthetic
# ===========================================================================
class GITSTheme:
    """Ghost in the Shell color theme for terminal output"""

    # Color definitions (ANSI 256/truecolor approximations)
    # Primary palette
    NEON_GREEN = "\033[38;5;48m"  # #00ff9f
    CYAN = "\033[38;5;51m"  # #26c6da
    TEAL = "\033[38;5;43m"  # #00d4aa
    CRIMSON = "\033[38;5;197m"  # #ff0066
    AMBER = "\033[38;5;214m"  # #ffa726
    ICE_BLUE = "\033[38;5;153m"  # #b3e5fc

    # Muted tones
    STEEL = "\033[38;5;240m"  # #4a5f6d
    SLATE = "\033[38;5;66m"  # #6b8e9e
    MIDNIGHT = "\033[38;5;235m"  # #0a0e14
    DEEP_BLUE = "\033[38;5;234m"  # #0d1117

    # Backgrounds
    BG_DARK = "\033[48;5;234m"

    # Styles
    BOLD = "\033[1m"
    DIM = "\033[2m"
    ITALIC = "\033[3m"
    UNDERLINE = "\033[4m"
    BLINK = "\033[5m"
    REVERSE = "\033[7m"

    # Reset
    RESET = "\033[0m"

    # Status colors
    @classmethod
    def status(cls, status: Optional[TestStatus]) -> str:
        """Get color for test status"""
        if status is None:
            return cls.ICE_BLUE
        if status == TestStatus.PASS:
            return cls.NEON_GREEN
        elif status == TestStatus.FAIL:
            return cls.CRIMSON
        elif status == TestStatus.WARN:
            return cls.AMBER
        else:
            return cls.STEEL

    @classmethod
    def icon(cls, status: Optional[TestStatus]) -> str:
        """Get icon for test status - uses ASCII-safe chars for Windows compatibility"""
        if status is None:
            return ">"
        if status == TestStatus.PASS:
            return "+"  # Plus - represents success
        elif status == TestStatus.FAIL:
            return "!"  # Exclamation - failure
        elif status == TestStatus.WARN:
            return "~"  # Tilde - warning
        else:
            return "-"  # Minus - skipped


# ===========================================================================
# Terminal Styling Utilities
# ===========================================================================
class TerminalUI:
    """Terminal UI styling utilities"""

    _theme = GITSTheme()
    _term_width: Optional[int] = None
    
    @classmethod
    def _strip_ansi(cls, text: str) -> str:
        """Remove ANSI escape codes from string to get visible length"""
        import re
        ansi_escape = re.compile(r'\x1B(?:[@-Z\\-_]|\[[0-?]*[ -/]*[@-~])')
        return ansi_escape.sub('', text)
    
    @classmethod
    def _visible_len(cls, text: str) -> int:
        """Get visible length of string (excluding ANSI codes)"""
        return len(cls._strip_ansi(text))
    
    @classmethod
    def get_width(cls) -> int:
        """Get terminal width, fallback to 80"""
        if cls._term_width is None:
            try:
                cls._term_width = shutil.get_terminal_size().columns
            except Exception:
                cls._term_width = 80
        return min(cls._term_width, 100)  # Cap at 100 for aesthetics

    @classmethod
    def hr(cls, char: str = "=", color: Optional[str] = None) -> str:
        """Create horizontal rule"""
        width = cls.get_width()
        line = char * width
        if color:
            return f"{color}{line}{cls._theme.RESET}"
        return line

    @classmethod
    def box_top(cls, title: str = "", color: Optional[str] = None) -> str:
        """Create box top border with optional title"""
        width = cls.get_width()
        c = color or cls._theme.STEEL
        if title:
            visible_len = cls._visible_len(title)
            padding = (width - visible_len - 4) // 2
            left = "+" + "=" * padding
            right = "=" * (width - padding - visible_len - 4) + "+"
            return f"{c}{left} {cls._theme.BOLD}{title} {c}{right}{cls._theme.RESET}"
        else:
            return f"{c}+{'=' * (width - 2)}+{cls._theme.RESET}"
    
    @classmethod
    def box_bottom(cls, color: Optional[str] = None) -> str:
        """Create box bottom border"""
        width = cls.get_width()
        c = color or cls._theme.STEEL
        return f"{c}+{'=' * (width - 2)}+{cls._theme.RESET}"
    
    @classmethod
    def box_line(
        cls, content: str = "", color: Optional[str] = None, align: str = "left"
    ) -> str:
        """Create box content line"""
        width = cls.get_width()
        c = color or cls._theme.STEEL
        inner_width = width - 4
        visible_len = cls._visible_len(content)

        if align == "center":
            padding = (inner_width - visible_len) // 2
            text = (
                " " * padding + content + " " * (inner_width - padding - visible_len)
            )
        elif align == "right":
            text = " " * (inner_width - visible_len) + content
        else:
            text = content + " " * (inner_width - visible_len)

        # Truncate if too long (check visible length)
        if cls._visible_len(text) > inner_width:
            text = cls._strip_ansi(text)[:inner_width-3] + "..."

        return f"{c}|{cls._theme.RESET} {text} {c}|{cls._theme.RESET}"

    @classmethod
    def section_header(cls, title: str, icon: str = ">") -> str:
        """Create section header"""
        c = cls._theme.CYAN
        t = cls._theme
        return f"\n{t.BOLD}{c}{icon} {title.upper()}{t.RESET}\n{t.DIM}{cls.hr('-', t.STEEL)}{t.RESET}"

    @classmethod
    def metric(cls, label: str, value: str, status: Optional[TestStatus] = None) -> str:
        """Format a metric line"""
        t = cls._theme
        status_color = t.status(status)
        return f"  {t.STEEL}|{t.RESET} {t.DIM}{label}{t.RESET} {status_color}{value}{t.RESET}"

    @classmethod
    def status_line(cls, status: TestStatus, label: str, message: str = "") -> str:
        """Format a status line with icon"""
        t = cls._theme
        color = t.status(status)
        icon = t.icon(status)

        if message:
            return f"  {color}{icon}{t.RESET} {label} {t.STEEL}>{t.RESET} {message}"
        else:
            return f"  {color}{icon}{t.RESET} {label}"

    @classmethod
    def script_card(cls, path: str, script_type: str) -> str:
        """Create script test card header"""
        t = cls._theme
        type_color = t.CYAN if script_type == "python" else t.TEAL
        type_icon = "PY" if script_type == "python" else "SH"

        return (
            f"\n{t.DIM}{cls.hr('-')}{t.RESET}\n"
            f"{t.BOLD}{type_color}[{type_icon}] {path}{t.RESET}\n"
            f"{t.STEEL}    {script_type.upper()}{t.RESET}"
        )

    @classmethod
    def summary_card(cls, summary: Dict[str, Any]) -> str:
        """Create final summary card"""
        t = cls._theme
        total = summary["total_scripts"]
        passed = summary["passed"]
        failed = summary["failed"]
        warned = summary["warned"]
        skipped = summary["skipped"]
        duration = summary["duration_ms"]

        lines = [
            "",
            cls.box_top("TACHIKOMA SMOKE TEST", t.CYAN),
            cls.box_line(
                f"{t.BOLD}{t.ICE_BLUE}System Diagnostic Complete{t.RESET}",
                align="center",
            ),
            cls.box_line(""),
        ]

        # Stats
        lines.append(
            cls.box_line(
                f"{t.STEEL}Scripts Analyzed:{t.RESET} {t.BOLD}{total}{t.RESET}"
            )
        )
        lines.append(cls.box_line(f"{t.NEON_GREEN}+ Passed:{t.RESET}      {passed:>3}"))

        if failed > 0:
            lines.append(
                cls.box_line(f"{t.CRIMSON}! Failed:{t.RESET}      {failed:>3}")
            )
        if warned > 0:
            lines.append(cls.box_line(f"{t.AMBER}~ Warned:{t.RESET}      {warned:>3}"))
        if skipped > 0:
            lines.append(cls.box_line(f"{t.STEEL}- Skipped:{t.RESET}     {skipped:>3}"))

        lines.append(cls.box_line(""))
        lines.append(
            cls.box_line(
                f"{t.SLATE}Execution Time: {duration / 1000:.2f}s{t.RESET}",
                align="center",
            )
        )
        lines.append(cls.box_bottom(t.CYAN))
        lines.append("")

        # Status message
        if failed > 0:
            lines.append(
                f"{t.BOLD}{t.CRIMSON}! SYSTEM ALERT: Critical failures detected{t.RESET}"
            )
        elif warned > 0:
            lines.append(f"{t.BOLD}{t.AMBER}~ SYSTEM NOTICE: Warnings present{t.RESET}")
        else:
            lines.append(
                f"{t.BOLD}{t.NEON_GREEN}+ SYSTEM STATUS: All tests passed{t.RESET}"
            )

        return "\n".join(lines)


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
        self.ui = TerminalUI()

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

        self._print(self.ui.script_card(str(script_path), script_type))

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
            self._print(self.ui.status_line(TestStatus.PASS, "syntax", "valid"))
        except py_compile.PyCompileError as e:
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.FAIL,
                    message=f"Syntax error: {str(e)}",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
            self._print(self.ui.status_line(TestStatus.FAIL, "syntax", str(e)[:50]))
            if self.fail_fast:
                return

        # Test 2: Import check
        test_start = time.time()
        imports_ok, import_msg = self._check_python_imports(script_path)
        status = TestStatus.PASS if imports_ok else TestStatus.WARN
        result.add_test(
            TestResult(
                name="imports",
                status=status,
                message=import_msg,
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "imports", import_msg[:50]))

        # Test 3: Shebang check
        test_start = time.time()
        first_line = script_path.read_text(encoding="utf-8", errors="ignore").split(
            "\n"
        )[0]
        has_shebang = first_line.startswith("#!")
        status = TestStatus.PASS if has_shebang else TestStatus.WARN
        msg = "present" if has_shebang else "missing"
        result.add_test(
            TestResult(
                name="shebang",
                status=status,
                message=f"Shebang {msg}",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "shebang", msg))

        # Test 4: CLI interface check (if main block exists)
        test_start = time.time()
        has_cli = self._check_python_cli(script_path)
        status = TestStatus.PASS if has_cli else TestStatus.SKIP
        msg = "present" if has_cli else "none (optional)"
        result.add_test(
            TestResult(
                name="cli_interface",
                status=status,
                message=f"CLI {msg}",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "cli", msg))

        # Test 5: Basic execution (if has CLI)
        test_start = time.time()
        if has_cli:
            exec_ok, exec_msg = self._test_python_execution(script_path)
            status = TestStatus.PASS if exec_ok else TestStatus.WARN
            result.add_test(
                TestResult(
                    name="execution",
                    status=status,
                    message=exec_msg,
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
            self._print(self.ui.status_line(status, "execution", exec_msg[:50]))

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
                "shutil",
                "ast",
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
        status = TestStatus.PASS if has_shebang else TestStatus.FAIL
        msg = "present" if has_shebang else "missing"
        result.add_test(
            TestResult(
                name="shebang",
                status=status,
                message=f"Shebang {msg}",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "shebang", msg))

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
                self._print(self.ui.status_line(TestStatus.PASS, "syntax", "valid"))
            else:
                result.add_test(
                    TestResult(
                        name="syntax",
                        status=TestStatus.FAIL,
                        message=f"Syntax error: {proc.stderr[:100]}",
                        duration_ms=(time.time() - test_start) * 1000,
                    )
                )
                self._print(
                    self.ui.status_line(TestStatus.FAIL, "syntax", proc.stderr[:50])
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
            self._print(self.ui.status_line(TestStatus.WARN, "syntax", "timeout"))
        except FileNotFoundError:
            result.add_test(
                TestResult(
                    name="syntax",
                    status=TestStatus.WARN,
                    message="bash not found, skipping syntax check",
                    duration_ms=(time.time() - test_start) * 1000,
                )
            )
            self._print(
                self.ui.status_line(TestStatus.WARN, "syntax", "bash not found")
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
            self._print(self.ui.status_line(TestStatus.WARN, "syntax", str(e)[:50]))

        # Test 3: Executable check
        test_start = time.time()
        is_executable = os.access(script_path, os.X_OK)
        status = TestStatus.PASS if is_executable else TestStatus.WARN
        msg = "yes" if is_executable else "no (optional)"
        result.add_test(
            TestResult(
                name="executable",
                status=status,
                message=f"Executable: {msg}",
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "executable", msg))

        # Test 4: Help command (common pattern in router scripts)
        test_start = time.time()
        help_ok, help_msg = self._test_shell_help(script_path)
        status = TestStatus.PASS if help_ok else TestStatus.WARN
        result.add_test(
            TestResult(
                name="help_command",
                status=status,
                message=help_msg,
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "help", help_msg[:50]))

        # Test 5: Basic execution
        test_start = time.time()
        exec_ok, exec_msg = self._test_shell_execution(script_path)
        status = TestStatus.PASS if exec_ok else TestStatus.WARN
        result.add_test(
            TestResult(
                name="execution",
                status=status,
                message=exec_msg,
                duration_ms=(time.time() - test_start) * 1000,
            )
        )
        self._print(self.ui.status_line(status, "execution", exec_msg[:50]))

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
            t = self.ui._theme
            print(f"\n{t.STEEL}> No scripts found to test{t.RESET}\n")
            return {
                "total_scripts": 0,
                "passed": 0,
                "failed": 0,
                "warned": 0,
                "skipped": 0,
                "results": [],
                "duration_ms": (time.time() - start_time) * 1000,
            }

        t = self.ui._theme
        print(f"\n{t.CYAN}>{t.RESET} {t.BOLD}Initializing System Diagnostics{t.RESET}")
        print(f"{t.STEEL}  Target: {self.base_dir}{t.RESET}")
        print(f"{t.STEEL}  Scripts detected: {len(scripts)}{t.RESET}\n")

        # Test each script
        for script in scripts:
            result = self.test_script(script)
            self.results.append(result)

            # Stop on failure if fail_fast
            if self.fail_fast and result.overall_status == TestStatus.FAIL:
                print(
                    f"\n{self.ui._theme.CRIMSON}! FAIL-FAST: Stopping on first failure{self.ui._theme.RESET}"
                )
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
        print(self.ui.summary_card(summary))

        # Print failures in detail
        if summary["failed"] > 0:
            print(self.ui.section_header("FAILURE DETAILS", "!"))
            for result in summary["results"]:
                if result["overall_status"] == "FAIL":
                    t = self.ui._theme
                    print(f"\n{t.CRIMSON}! {result['script_path']}{t.RESET}")
                    failed_tests = [t for t in result["tests"] if t["status"] == "FAIL"]
                    for test in failed_tests:
                        print(
                            f"  {t.STEEL} | {t.RESET} {t.BOLD}{test['name']}{t.RESET}: {test['message']}"
                        )

        # Print warnings in detail
        if summary["warned"] > 0:
            print(self.ui.section_header("WARNING DETAILS", "~"))
            for result in summary["results"]:
                if result["overall_status"] == "WARN":
                    t = self.ui._theme
                    print(f"\n{t.AMBER}~ {result['script_path']}{t.RESET}")
                    warned_tests = [t for t in result["tests"] if t["status"] == "WARN"]
                    for test in warned_tests:
                        print(
                            f"  {t.STEEL} | {t.RESET} {t.BOLD}{test['name']}{t.RESET}: {test['message']}"
                        )

        # Exit code
        if summary["failed"] > 0:
            sys.exit(1)
        elif summary["warned"] > 0:
            sys.exit(0)
        else:
            sys.exit(0)

    def _print(self, message: str):
        """Print message if verbose or always print important messages"""
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
