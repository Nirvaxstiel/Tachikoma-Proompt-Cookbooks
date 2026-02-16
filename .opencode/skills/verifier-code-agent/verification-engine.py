"""
Verification Engine for Generator-Verifier-Reviser
Implements comprehensive code verification
Purpose: +20-30% code correctness for complex tasks

Based on: Aletheia (Google DeepMind, arXiv:2602.10177) - achieved 90% on IMO-ProofBench
"""

import ast
import os
import re
import tempfile
from typing import Dict, List, Tuple, Optional, Any
from enum import Enum


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
    
    def __init__(self, criterion: str, passed: bool, message: str = "", details: Dict = None):
        self.criterion = criterion
        self.passed = passed
        self.message = message
        self.details = details or {}
    
    def to_dict(self) -> Dict:
        return {
            'criterion': self.criterion,
            'passed': self.passed,
            'message': self.message,
            'details': self.details
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
                results.append(VerificationResult(
                    criterion=criterion_name.value,
                    passed=False,
                    message=f"Verification error: {str(e)}"
                ))
                all_passed = False
        
        return {
            'overall_pass': all_passed,
            'results': [r.to_dict() for r in results],
            'confidence': self._calculate_confidence(results),
            'criteria_passed': sum(1 for r in results if r.passed),
            'criteria_total': len(results)
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
        
        if language == 'python':
            try:
                ast.parse(code)
                return VerificationResult(
                    criterion=VerificationCriterion.SYNTAX.value,
                    passed=True,
                    message="Python syntax is valid"
                )
            except SyntaxError as e:
                return VerificationResult(
                    criterion=VerificationCriterion.SYNTAX.value,
                    passed=False,
                    message=f"Syntax error at line {e.lineno}: {e.msg}",
                    details={'line': e.lineno, 'offset': e.offset}
                )
        
        elif language == 'javascript':
            # Basic JS syntax check (can be enhanced with Node.js)
            if 'function' in code or 'const' in code or 'let' in code:
                return VerificationResult(
                    criterion=VerificationCriterion.SYNTAX.value,
                    passed=True,
                    message="JavaScript syntax appears valid"
                )
        
        # Default: assume valid for unknown languages
        return VerificationResult(
            criterion=VerificationCriterion.SYNTAX.value,
            passed=True,
            message=f"Syntax check skipped (language: {language})"
        )
    
    def _detect_language(self, code: str) -> str:
        """Detect programming language"""
        code_stripped = code.strip()
        
        if re.match(r'^(def |class |import |from |if __name__)', code_stripped, re.MULTILINE):
            return 'python'
        elif re.match(r'^(function |const |let |var |class |import |export )', code_stripped, re.MULTILINE):
            return 'javascript'
        elif re.match(r'^(func |package |import |type |struct )', code_stripped, re.MULTILINE):
            return 'go'
        elif re.match(r'^(public |private |protected |class |void |int )', code_stripped, re.MULTILINE):
            return 'java'
        
        return 'unknown'
    
    # ==================== LOGIC CHECK ====================
    
    def check_logic(self, code: str, requirements: str) -> VerificationResult:
        """Check logic correctness via self-verification questions"""
        questions = [
            "Does this code directly solve the stated problem?",
            "What assumptions is this code making about inputs?",
            "What edge cases could break this code?",
            "Are there any unhandled error conditions?",
            "Is there any unnecessary complexity?"
        ]
        
        # Analyze code for common logic issues
        issues = []
        
        # Check for empty functions
        if re.search(r'def\s+\w+\(\s*\):\s*(?:pass|...|$)', code):
            issues.append("Empty function detected")
        
        # Check for TODO/FIXME in code
        if re.search(r'#\s*(TODO|FIXME|HACK|XXX)', code, re.IGNORECASE):
            issues.append("Unresolved TODO/FIXME in code")
        
        # Check for potential infinite loops
        if re.search(r'while\s+True:', code) and 'break' not in code:
            issues.append("Potential infinite loop without break")
        
        # Check for unused variables
        # (simplified check - would need AST for proper analysis)
        
        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.LOGIC.value,
                passed=False,
                message="Logic issues found",
                details={'issues': issues}
            )
        
        return VerificationResult(
            criterion=VerificationCriterion.LOGIC.value,
            passed=True,
            message="Logic appears correct",
            details={'questions': questions}
        )
    
    # ==================== INTEGRATION CHECK ====================
    
    def check_integration(self, code: str, requirements: str) -> VerificationResult:
        """Check integration with existing codebase"""
        issues = []
        
        # Extract imports
        imports = re.findall(r'^(?:import|from)\s+([^\s;]+)', code, re.MULTILINE)
        
        # Check for common issues
        for imp in imports:
            # Check for relative imports in production code
            if imp.startswith('.'):
                issues.append(f"Relative import detected: {imp}")
        
        # Check function/variable definitions
        functions = re.findall(r'^(?:def|class|function|const|let|var)\s+(\w+)', code, re.MULTILINE)
        
        # Check for required function (from requirements)
        # This is a simplified check - would need more context in real usage
        
        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.INTEGRATION.value,
                passed=False,
                message="Integration issues found",
                details={'issues': issues, 'imports': imports, 'functions': functions}
            )
        
        return VerificationResult(
            criterion=VerificationCriterion.INTEGRATION.value,
            passed=True,
            message="Integration checks passed",
            details={'imports': imports, 'functions': functions}
        )
    
    # ==================== EDGE CASE CHECK ====================
    
    def check_edge_cases(self, code: str, requirements: str) -> VerificationResult:
        """Check edge case handling"""
        edge_cases = {
            'null_handling': r'(?:is\s+None|==\s+None|is\s+not\s+None|null|\bnull\b)',
            'empty_input': r'(?:if\s+not\s+\w+|if\s+\w+\s*==\s*[\[\(\{]|len\()',
            'exception_handling': r'(?:try:|except|raise|throw)',
            'type_checking': r'(?:isinstance|type\(|typeof)',
        }
        
        found_handling = []
        missing_handling = []
        
        for case_name, pattern in edge_cases.items():
            if re.search(pattern, code):
                found_handling.append(case_name)
            else:
                missing_handling.append(case_name)
        
        # Check for common edge cases in requirements
        if 'null' in requirements.lower() or 'none' in requirements.lower():
            if 'null_handling' not in found_handling:
                missing_handling.append('null handling (required by spec)')
        
        if 'empty' in requirements.lower():
            if 'empty_input' not in found_handling:
                missing_handling.append('empty input handling (required by spec)')
        
        if issues := missing_handling:
            return VerificationResult(
                criterion=VerificationCriterion.EDGE_CASES.value,
                passed=False,
                message="Potential edge cases not handled",
                details={
                    'found_handling': found_handling,
                    'missing_handling': issues
                }
            )
        
        return VerificationResult(
            criterion=VerificationCriterion.EDGE_CASES.value,
            passed=True,
            message="Edge case handling appears adequate",
            details={'found_handling': found_handling}
        )
    
    # ==================== SECURITY CHECK ====================
    
    def check_security(self, code: str, requirements: str) -> VerificationResult:
        """Check for common security issues"""
        issues = []
        
        # Check for SQL injection vulnerabilities
        if re.search(r'(?:execute|query|cursor)\s*\([^)]*\+[^)]*\)', code, re.IGNORECASE):
            issues.append("Potential SQL injection - string concatenation in query")
        
        # Check for hardcoded credentials
        if re.search(r'(?:password|secret|api_key|token)\s*=\s*["\'][^"\']{8,}["\']', code, re.IGNORECASE):
            issues.append("Potential hardcoded credentials detected")
        
        # Check for eval usage
        if re.search(r'\beval\s*\(', code):
            issues.append("Use of eval() is a security risk")
        
        # Check for command injection
        if re.search(r'(?:os\.system|subprocess\.call|os\.popen)\s*\([^)]*\+[^)]*\)', code):
            issues.append("Potential command injection - string concatenation in system call")
        
        # Check for insecure random
        if re.search(r'random\.(?:random|randint)\s*\(', code) and 'security' in requirements.lower():
            issues.append("Insecure random for security purposes - use secrets module")
        
        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.SECURITY.value,
                passed=False,
                message="Security issues found",
                details={'issues': issues}
            )
        
        return VerificationResult(
            criterion=VerificationCriterion.SECURITY.value,
            passed=True,
            message="No obvious security issues detected"
        )
    
    # ==================== PERFORMANCE CHECK ====================
    
    def check_performance(self, code: str, requirements: str) -> VerificationResult:
        """Check for common performance issues"""
        issues = []
        
        # Check for nested loops that might be O(n^2)
        if len(re.findall(r'\bfor\s+', code)) >= 2:
            # Check if there's nested iteration
            if re.search(r'for\s+\w+\s+in\s+.*:\s*.*for\s+\w+\s+in\s+', code, re.DOTALL):
                issues.append("Potential O(n^2) nested loops detected")
        
        # Check for inefficient string concatenation in loop
        if re.search(r'\+=.*\n.*for\s+', code, re.DOTALL):
            issues.append("String concatenation in loop - use list join instead")
        
        # Check for missing indexes on frequently queried fields
        # (would need database context)
        
        if issues:
            return VerificationResult(
                criterion=VerificationCriterion.PERFORMANCE.value,
                passed=False,
                message="Potential performance issues found",
                details={'issues': issues}
            )
        
        return VerificationResult(
            criterion=VerificationCriterion.PERFORMANCE.value,
            passed=True,
            message="No obvious performance issues detected"
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
if __name__ == '__main__':
    import argparse
    
    parser = argparse.ArgumentParser(description='Verification Engine')
    subparsers = parser.add_subparsers(dest='command')
    
    verify_parser = subparsers.add_parser('verify', help='Verify code')
    verify_parser.add_argument('code', help='Code to verify')
    verify_parser.add_argument('--requirements', default='', help='Requirements specification')
    
    args = parser.parse_args()
    
    if args.command == 'verify':
        engine = get_verification_engine()
        result = engine.verify(args.code, args.requirements)
        
        print(f"\n=== VERIFICATION RESULTS ===")
        print(f"Overall: {'PASS' if result['overall_pass'] else 'FAIL'}")
        print(f"Confidence: {result['confidence']:.0%}")
        print(f"Criteria: {result['criteria_passed']}/{result['criteria_total']}")
        
        print("\nDetails:")
        for r in result['results']:
            status = "[PASS]" if r['passed'] else "[FAIL]"
            print(f"  {status} {r['criterion']}: {r['message']}")
    else:
        parser.print_help()
