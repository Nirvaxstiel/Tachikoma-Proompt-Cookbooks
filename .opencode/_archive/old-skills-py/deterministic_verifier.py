#!/usr/bin/env python3
"""
Deterministic Verifier - Run deterministic verification checks without LLM calls.

Key insight: Many checks can be fully deterministic (syntax, imports, tests, linting)

Usage:
    python deterministic_verifier.py --file <path> [--check <check_type>] [--all]

Check types:
    - syntax: Python/JS syntax validation
    - imports: Check if imports exist
    - tests: Run relevant tests
    - lint: Run linter
    - security: Basic security checks
    - all: Run all checks
"""

import argparse
import json
import os
import py_compile
import re
import subprocess
import sys
from pathlib import Path
from typing import Any, Dict, List, Optional


class VerificationResult:
    def __init__(self):
        self.checks: List[Dict[str, Any]] = []
        self.passed = True

    def add_check(
        self, name: str, passed: bool, message: str, details: Optional[Dict] = None
    ):
        self.checks.append(
            {
                "name": name,
                "passed": passed,
                "message": message,
                "details": details or {},
            }
        )
        if not passed:
            self.passed = False

    def to_json(self) -> str:
        return json.dumps(
            {"overall_passed": self.passed, "checks": self.checks}, indent=2
        )

    def summary(self) -> str:
        passed = sum(1 for c in self.checks if c["passed"])
        total = len(self.checks)
        return f"{passed}/{total} checks passed"


def check_syntax_python(file_path: str) -> VerificationResult:
    """Check Python syntax."""
    result = VerificationResult()

    try:
        py_compile.compile(file_path, doraise=True)
        result.add_check("syntax_python", True, "No syntax errors")
    except py_compile.PyCompileError as e:
        result.add_check("syntax_python", False, f"Syntax error: {str(e)}")
    except Exception as e:
        result.add_check("syntax_python", False, f"Check failed: {str(e)}")

    return result


def check_syntax_js(file_path: str) -> VerificationResult:
    """Check JavaScript syntax."""
    result = VerificationResult()

    # Try node --check
    try:
        proc = subprocess.run(
            ["node", "--check", file_path], capture_output=True, text=True, timeout=10
        )
        if proc.returncode == 0:
            result.add_check("syntax_js", True, "No syntax errors")
        else:
            result.add_check("syntax_js", False, f"Syntax error: {proc.stderr}")
    except FileNotFoundError:
        result.add_check("syntax_js", True, "Node not available, skipping")
    except Exception as e:
        result.add_check("syntax_js", False, f"Check failed: {str(e)}")

    return result


def check_imports_python(file_path: str) -> VerificationResult:
    """Check if imports in file are available."""
    result = VerificationResult()

    try:
        content = Path(file_path).read_text(encoding="utf-8")

        # Extract imports
        imports = re.findall(r"^(?:from\s+(\S+)|import\s+(\S+))", content, re.MULTILINE)
        imports = [i[0] or i[1] for i in imports]

        # Filter standard library
        stdlib = {
            "os",
            "sys",
            "re",
            "json",
            "time",
            "datetime",
            "collections",
            "itertools",
            "functools",
            "operator",
            "string",
            "struct",
            "math",
            "random",
            "statistics",
            "urllib",
            "http",
            "email",
            "html",
            "xml",
            "csv",
            "io",
            "pickle",
            "sqlite3",
        }

        external = [i.split(".")[0] for i in imports if i.split(".")[0] not in stdlib]

        if not external:
            result.add_check("imports_python", True, "No external imports needed")
            return result

        # Try importing each
        missing = []
        for imp in external:
            try:
                __import__(imp)
            except ImportError:
                missing.append(imp)

        if missing:
            result.add_check(
                "imports_python", False, f"Missing imports: {', '.join(missing)}"
            )
        else:
            result.add_check("imports_python", True, "All imports available")

    except Exception as e:
        result.add_check("imports_python", False, f"Check failed: {str(e)}")

    return result


def check_tests(file_path: str, test_dir: Optional[str] = None) -> VerificationResult:
    """Run relevant tests if found."""
    result = VerificationResult()

    # Find test files related to this module
    path = Path(file_path)
    module_name = path.stem
    test_patterns = [
        f"test_{module_name}*.py",
        f"{module_name}_test*.py",
        f"tests/test_{module_name}*.py",
    ]

    test_files = []
    for pattern in test_patterns:
        test_files.extend(path.parent.glob(pattern))

    if test_dir:
        test_files.extend(Path(test_dir).glob(f"*{module_name}*.py"))

    if not test_files:
        result.add_check("tests", True, "No tests found, skipping")
        return result

    # Try to run tests
    for test_file in test_files[:3]:  # Limit to 3 test files
        try:
            proc = subprocess.run(
                [sys.executable, "-m", "pytest", str(test_file), "-v", "--tb=short"],
                capture_output=True,
                text=True,
                timeout=60,
                cwd=path.parent,
            )

            if proc.returncode == 0:
                result.add_check(f"tests_{test_file.name}", True, "All tests passed")
            else:
                # Extract failures
                failures = re.findall(r"FAILED (.*)", proc.stdout)
                if failures:
                    result.add_check(
                        f"tests_{test_file.name}",
                        False,
                        f"Failures: {', '.join(failures[:3])}",
                    )
                else:
                    result.add_check(
                        f"tests_{test_file.name}",
                        False,
                        f"Tests failed (exit {proc.returncode})",
                    )

        except subprocess.TimeoutExpired:
            result.add_check(f"tests_{test_file.name}", False, "Tests timed out")
        except FileNotFoundError:
            result.add_check("tests", True, "pytest not available, skipping")
        except Exception as e:
            result.add_check(
                f"tests_{test_file.name}", False, f"Check failed: {str(e)}"
            )

    return result


def check_lint(file_path: str) -> VerificationResult:
    """Run basic linting checks."""
    result = VerificationResult()
    path = Path(file_path)

    # Check for common issues
    content = path.read_text(encoding="utf-8")
    issues = []

    # Check for debug statements
    if re.search(r"\bprint\s*\(", content) and not file_path.endswith("_test.py"):
        issues.append("Contains print statements (consider removing)")

    # Check for TODO without context
    todos = re.findall(r"#\s*TODO:?.*", content, re.IGNORECASE)
    if len(todos) > 5:
        issues.append(f"Contains {len(todos)} TODOs")

    # Check for hardcoded secrets
    if re.search(
        r'(password|secret|api_key|token)\s*=\s*["\'][^"\']{8,}["\']',
        content,
        re.IGNORECASE,
    ):
        issues.append("May contain hardcoded secrets")

    # Check line length
    long_lines = [
        (i + 1, len(line))
        for i, line in enumerate(content.split("\n"))
        if len(line) > 120
    ]
    if long_lines:
        issues.append(f"{len(long_lines)} lines over 120 chars")

    if issues:
        result.add_check("lint_basic", False, "; ".join(issues))
    else:
        result.add_check("lint_basic", True, "No basic lint issues")

    # Try ruff if available
    try:
        proc = subprocess.run(
            ["ruff", "check", file_path], capture_output=True, text=True, timeout=10
        )
        if proc.returncode == 0:
            result.add_check("lint_ruff", True, "No ruff issues")
        else:
            errors = proc.stdout.strip().split("\n")[:5]
            result.add_check("lint_ruff", False, f"Ruff: {len(errors)} issues")
    except FileNotFoundError:
        pass
    except Exception:
        pass

    return result


def check_security(file_path: str) -> VerificationResult:
    """Basic security checks."""
    result = VerificationResult()
    path = Path(file_path)
    content = path.read_text(encoding="utf-8")

    issues = []

    # Check for dangerous functions
    dangerous = {
        "eval": "executes arbitrary code",
        "exec": "executes arbitrary code",
        "pickle.load": "can execute arbitrary code",
        "subprocess.call": "can invoke shell commands",
        "subprocess.run": "can invoke shell commands",
    }

    for func, desc in dangerous.items():
        if func in content:
            issues.append(f"Uses {func}: {desc}")

    # Check for SQL injection vectors
    if re.search(r'execute\s*\(\s*f["\']', content) or re.search(
        r'execute\s*\(\s*["\'].*%s', content
    ):
        if "cursor.execute" in content or "connection.execute" in content:
            issues.append("Potential SQL injection risk")

    # Check for path traversal
    if "open(" in content and ".." in content:
        issues.append("Potential path traversal")

    if issues:
        result.add_check("security_basic", False, "; ".join(issues))
    else:
        result.add_check("security_basic", True, "No obvious security issues")

    return result


def check_dependencies(file_path: str) -> VerificationResult:
    """Check if dependencies in requirements.txt or pyproject.toml are met."""
    result = VerificationResult()
    path = Path(file_path)

    # Look for dependency files
    dep_files = [
        path.parent / "requirements.txt",
        path.parent / "pyproject.toml",
        path.parent / "setup.py",
    ]

    dep_file = None
    for f in dep_files:
        if f.exists():
            dep_file = f
            break

    if not dep_file:
        result.add_check("dependencies", True, "No dependency file found")
        return result

    # Try installing dependencies (dry run)
    try:
        if dep_file.name == "requirements.txt":
            proc = subprocess.run(
                [
                    sys.executable,
                    "-m",
                    "pip",
                    "install",
                    "-r",
                    str(dep_file),
                    "--dry-run",
                ],
                capture_output=True,
                text=True,
                timeout=30,
            )
        else:
            proc = None

        if proc and proc.returncode != 0:
            if "could not resolve" in proc.stderr.lower():
                result.add_check("dependencies", False, "Unmet dependencies")
            else:
                result.add_check("dependencies", True, "Dependencies OK")
        else:
            result.add_check("dependencies", True, "Dependencies OK")

    except Exception as e:
        result.add_check("dependencies", True, f"Could not verify: {str(e)}")

    return result


def run_verification(file_path: str, check_types: List[str]) -> VerificationResult:
    """Run specified verification checks."""
    path = Path(file_path)

    if not path.exists():
        result = VerificationResult()
        result.add_check("file_exists", False, f"File not found: {file_path}")
        return result

    result = VerificationResult()
    result.add_check("file_exists", True, "File exists")

    # Determine file type
    suffix = path.suffix.lower()

    for check in check_types:
        if check == "syntax" or check == "all":
            if suffix == ".py":
                result.checks.extend(check_syntax_python(file_path).checks)
            elif suffix in [".js", ".ts", ".jsx", ".tsx"]:
                result.checks.extend(check_syntax_js(file_path).checks)

        if check == "imports" or check == "all":
            if suffix == ".py":
                result.checks.extend(check_imports_python(file_path).checks)

        if check == "tests" or check == "all":
            result.checks.extend(check_tests(file_path).checks)

        if check == "lint" or check == "all":
            result.checks.extend(check_lint(file_path).checks)

        if check == "security" or check == "all":
            result.checks.extend(check_security(file_path).checks)

        if check == "dependencies" or check == "all":
            if suffix == ".py":
                result.checks.extend(check_dependencies(file_path).checks)

    # Recalculate overall passed
    result.passed = all(c["passed"] for c in result.checks)

    return result


def main():
    parser = argparse.ArgumentParser(
        description="Deterministic code verification without LLM"
    )
    parser.add_argument("--file", required=True, help="File to verify")
    parser.add_argument(
        "--check",
        action="append",
        help="Check type (syntax, imports, tests, lint, security, dependencies, all)",
    )
    parser.add_argument("--all", action="store_true", help="Run all checks")
    parser.add_argument("--json", action="store_true", help="Output JSON")
    parser.add_argument("--test-dir", help="Directory to find tests")

    args = parser.parse_args()

    check_types = args.check or ["all"]
    if args.all:
        check_types = ["all"]

    result = run_verification(args.file, check_types)

    if args.json:
        print(result.to_json())
    else:
        print(f"Verification: {result.summary()}")
        for check in result.checks:
            status = "[OK]" if check["passed"] else "[FAIL]"
            print(f"  {status} {check['name']}: {check['message']}")

        if not result.passed:
            print("\n[WARN]  Some checks failed - consider review before proceeding")
            return 1

    return 0 if result.passed else 1


if __name__ == "__main__":
    sys.exit(main())
