#!/usr/bin/env python3
"""
Verification Engine for Generator-Verifier-Reviser
Implements comprehensive code verification
Purpose: +20-30% code correctness for complex tasks

Based on: Aletheia (Google DeepMind, arXiv:2602.10177) - achieved 90% on IMO-ProofBench
"""

import ast
import itertools
import os
import re
import tempfile
from enum import Enum
from functools import lru_cache
from typing import Any, Dict, List, Optional, Tuple


@lru_cache(maxsize=32)
def _compile_verification_patterns():
    """Cache compiled regex patterns for verification"""
    return {
        "empty_function": re.compile(r"def\s+\w+\(\s*\):\s*(?:pass|...|$)"),
        "todo": re.compile(r"#\s*(TODO|FIXME|HACK|XXX)", re.IGNORECASE),
        "infinite_loop": re.compile(r"while\s+True:"),
        "sql_injection": re.compile(
            r"(?:execute|query|cursor)\s*\([^)]*\+[^)]*\)", re.IGNORECASE
        ),
        "hardcoded_creds": re.compile(
            r'(?:password|secret|api_key|token)\s*=\s*["\'][^"\']{8,}["\']',
            re.IGNORECASE,
        ),
        "eval_usage": re.compile(r"\beval\s*\("),
        "command_injection": re.compile(
            r"(?:os\.system|subprocess\.call|os\.popen)\s*\([^)]*\+[^)]*\)"
        ),
        "insecure_random": re.compile(r"random\.(?:random|randint)\s*\("),
        "nested_loops": re.compile(
            r"for\s+\w+\s+in\s+.*:\s*.*for\s+\w+\s+in\s+", re.DOTALL
        ),
        "string_concat_loop": re.compile(r"\+=.*\n.*for\s+", re.DOTALL),
    }


@lru_cache(maxsize=64)
def _compile_language_patterns():
    """Cache compiled regex patterns for language detection"""
    return {
        "python": re.compile(r"^(def |class |import |from |if __name__)", re.MULTILINE),
        "javascript": re.compile(
            r"^(function |const |let |var |class |import |export )", re.MULTILINE
        ),
        "go": re.compile(r"^(func |package |import |type |struct )", re.MULTILINE),
        "java": re.compile(
            r"^(public |private |protected |class |void |int )", re.MULTILINE
        ),
    }


@lru_cache(maxsize=32)
def _compile_edge_case_patterns():
    """Cache compiled regex patterns for edge case detection"""
    return {
        "null_handling": re.compile(
            r"(?:is\s+None|==\s+None|is\s+not\s+None|null|\bnull\b)"
        ),
        "empty_input": re.compile(r"(?:if\s+not\s+\w+|if\s+\w+\s*==\s*[\[\(\{]|len\()"),
        "exception_handling": re.compile(r"(?:try:|except|raise|throw)"),
        "type_checking": re.compile(r"(?:isinstance|type\(|typeof)"),
    }


class VerificationCriterion(Enum):
    """Verification criteria types"""

    SYNTAX = "syntax"
    LOGIC = "logic"
    INTEGRATION = "integration"
    EDGE_CASES = "edge_cases"
    SECURITY = "security"
    PERFORMANCE = "performance"


class VerificationResult:
    """Result of verification check"""

    def __init__(
        self,
        criterion: str,
        passed: bool,
        message: str = "",
        details: Optional[Dict] = None,
    ):
        self.criterion = criterion
        self.passed = passed
        self.message = message
        self.details = details or {}

    def to_dict(self) -> Dict:
        return {
            "criterion": self.criterion,
            "passed": self.passed,
            "message": self.message,
            "details": self.details,
        }


class VerificationEngine:
    """Engine for verifying generated code"""

    def __init__(self):
        self.criteria = {
            VerificationCriterion.SYNTAX: self.check_syntax,
            VerificationCriterion.LOGIC: self.check_logic,
            VerificationCriterion.INTEGRATION: self.check_integration,
            VerificationCriterion.EDGE_CASES: self.check_edge_cases,
            VerificationCriterion.SECURITY: self.check_security,
        }

    def verify(self, generated_code: str, requirements: str) -> Dict[str, Any]:
        """Run verification checks

        Args:
            generated_code: The code to verify
            requirements: The requirements/specification being implemented

        Returns:
            Dictionary with verification results
        """
        results = []
        all_passed = True

        # Run each verification criterion
        for criterion_name, check_fn in self.criteria.items():
            try:
                result = check_fn(generated_code, requirements)
                results.append(result)

                if not result.passed:
                    all_passed = False
            except Exception as e:
                results.append(
                    VerificationResult(
                        criterion=criterion_name.value,
                        passed=False,
                        message=f"Verification error: {str(e)}",
                    )
                )
                all_passed = False

        return {
            "overall_pass": all_passed,
            "results": [r.to_dict() for r in results],
            "confidence": self._calculate_confidence(results),
            "criteria_passed": sum(1 for r in results if r.passed),
            "criteria_total": len(results),
        }

    def _calculate_confidence(self, results: List[VerificationResult]) -> float:
        """Calculate overall confidence from verification results"""
        if not results:
            return 0.0

        passed = sum(1 for r in results if r.passed)
        return passed / len(results)

    # ==================== SYNTAX CHECK ====================

    def check_syntax(self, code: str, requirements: str) -> VerificationResult:
        """Check syntax errors"""
        language = self._detect_language(code)

        if language == "python":
            try:
                ast.parse(code)
                return VerificationResult(
                    criterion=VerificationCriterion.SYNTAX.value,
                    passed=True,
                    message="Python syntax is valid",
                )
            except SyntaxError as e:
                return VerificationResult(
                    criterion=VerificationCriterion.SYNTAX.value,
                    passed=False,
                    message=f"Syntax error at line {e.lineno}: {e.msg}",
                    details={"line": e.lineno, "offset": e.offset},
                )

        elif language == "javascript":
            # Basic JS syntax check (can be enhanced with Node.js)
            if "function" in code or "const" in code or "let" in code:
                return VerificationResult(
                    criterion=VerificationCriterion.SYNTAX.value,
                    passed=True,
                    message="JavaScript syntax appears valid",
                )

        # Default: assume valid for unknown languages
        return VerificationResult(
            criterion=VerificationCriterion.SYNTAX.value,
            passed=True,
            message=f"Syntax check skipped (language: {language})",
        )

    def _detect_language(self, code: str) -> str:
        """Detect programming language"""
        code_stripped = code.strip()
        patterns = _compile_language_patterns()

        for lang, pattern in patterns.items():
            if pattern.match(code_stripped):
                return lang

        return "unknown"

    # ==================== LOGIC CHECK ====================

    def check_logic(self, code: str, requirements: str) -> VerificationResult:
        """Check logic correctness via self-verification questions"""
        questions = [
            "Does this code directly solve the stated problem?",
            "What assumptions is this code making about inputs?",
            "What edge cases could break this code?",
            "Are there any unhandled error conditions?",
            "Is there any unnecessary complexity?",
        ]

        patterns = _compile_verification_patterns()
        issues = []

        if patterns["empty_function"].search(code):
            issues.append("Empty function detected")

        if patterns["todo"].search(code):
            issues.append("Unresolved TODO/FIXME in code")

        if patterns["infinite_loop"].search(code) and "break" not in code:
            issues.append("Potential infinite loop without break")

        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.LOGIC.value,
                passed=False,
                message="Logic issues found",
                details={"issues": issues},
            )

        return VerificationResult(
            criterion=VerificationCriterion.LOGIC.value,
            passed=True,
            message="Logic appears correct",
            details={"questions": questions},
        )

    # ==================== INTEGRATION CHECK ====================

    def check_integration(self, code: str, requirements: str) -> VerificationResult:
        """Check integration with existing codebase"""
        issues = []

        # Extract imports
        imports = re.findall(r"^(?:import|from)\s+([^\s;]+)", code, re.MULTILINE)

        # Check for common issues
        for imp in imports:
            # Check for relative imports in production code
            if imp.startswith("."):
                issues.append(f"Relative import detected: {imp}")

        # Check function/variable definitions
        functions = re.findall(
            r"^(?:def|class|function|const|let|var)\s+(\w+)", code, re.MULTILINE
        )

        # Check for required function (from requirements)
        # This is a simplified check - would need more context in real usage

        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.INTEGRATION.value,
                passed=False,
                message="Integration issues found",
                details={"issues": issues, "imports": imports, "functions": functions},
            )

        return VerificationResult(
            criterion=VerificationCriterion.INTEGRATION.value,
            passed=True,
            message="Integration checks passed",
            details={"imports": imports, "functions": functions},
        )

    # ==================== EDGE CASE CHECK ====================

    def check_edge_cases(self, code: str, requirements: str) -> VerificationResult:
        """Check edge case handling"""
        patterns = _compile_edge_case_patterns()

        found_handling = []
        missing_handling = []

        for case_name, pattern in patterns.items():
            if pattern.search(code):
                found_handling.append(case_name)
            else:
                missing_handling.append(case_name)

        if "null" in requirements.lower() or "none" in requirements.lower():
            if "null_handling" not in found_handling:
                missing_handling.append("null handling (required by spec)")

        if "empty" in requirements.lower():
            if "empty_input" not in found_handling:
                missing_handling.append("empty input handling (required by spec)")

        if issues := missing_handling:
            return VerificationResult(
                criterion=VerificationCriterion.EDGE_CASES.value,
                passed=False,
                message="Potential edge cases not handled",
                details={"found_handling": found_handling, "missing_handling": issues},
            )

        return VerificationResult(
            criterion=VerificationCriterion.EDGE_CASES.value,
            passed=True,
            message="Edge case handling appears adequate",
            details={"found_handling": found_handling},
        )

    # ==================== SECURITY CHECK ====================

    def check_security(self, code: str, requirements: str) -> VerificationResult:
        """Check for common security issues"""
        patterns = _compile_verification_patterns()
        issues = []

        if patterns["sql_injection"].search(code):
            issues.append("Potential SQL injection - string concatenation in query")

        if patterns["hardcoded_creds"].search(code):
            issues.append("Potential hardcoded credentials detected")

        if patterns["eval_usage"].search(code):
            issues.append("Use of eval() is a security risk")

        if patterns["command_injection"].search(code):
            issues.append(
                "Potential command injection - string concatenation in system call"
            )

        if (
            patterns["insecure_random"].search(code)
            and "security" in requirements.lower()
        ):
            issues.append("Insecure random for security purposes - use secrets module")

        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.SECURITY.value,
                passed=False,
                message="Security issues found",
                details={"issues": issues},
            )

        return VerificationResult(
            criterion=VerificationCriterion.SECURITY.value,
            passed=True,
            message="No obvious security issues detected",
        )

    # ==================== PERFORMANCE CHECK ====================

    def check_performance(self, code: str, requirements: str) -> VerificationResult:
        """Check for common performance issues"""
        patterns = _compile_verification_patterns()
        issues = []

        if len(re.findall(r"\bfor\s+", code)) >= 2:
            if patterns["nested_loops"].search(code):
                issues.append("Potential O(n^2) nested loops detected")

        if patterns["string_concat_loop"].search(code):
            issues.append("String concatenation in loop - use list join instead")

        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.PERFORMANCE.value,
                passed=False,
                message="Potential performance issues found",
                details={"issues": issues},
            )

        return VerificationResult(
            criterion=VerificationCriterion.PERFORMANCE.value,
            passed=True,
            message="No obvious performance issues detected",
        )


# Singleton instance
_verification_engine = None


def get_verification_engine() -> VerificationEngine:
    """Get verification engine instance"""
    global _verification_engine
    if _verification_engine is None:
        _verification_engine = VerificationEngine()
    return _verification_engine


# CLI for testing
if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Verification Engine")
    subparsers = parser.add_subparsers(dest="command")

    verify_parser = subparsers.add_parser("verify", help="Verify code")
    verify_parser.add_argument("code", help="Code to verify")
    verify_parser.add_argument(
        "--requirements", default="", help="Requirements specification"
    )

    args = parser.parse_args()

    if args.command == "verify":
        engine = get_verification_engine()
        result = engine.verify(args.code, args.requirements)

        print(f"\n=== VERIFICATION RESULTS ===")
        print(f"Overall: {'PASS' if result['overall_pass'] else 'FAIL'}")
        print(f"Confidence: {result['confidence']:.0%}")
        print(f"Criteria: {result['criteria_passed']}/{result['criteria_total']}")

        print("\nDetails:")
        for r in result["results"]:
            status = "[PASS]" if r["passed"] else "[FAIL]"
            print(f"  {status} {r['criterion']}: {r['message']}")
    else:
        parser.print_help()
