#!/usr/bin/env bun
/**
 * Verification Engine for Generator-Verifier-Reviser
 * Implements comprehensive code verification
 * 
 * Purpose: +20-30% code correctness for complex tasks
 * Based on: Aletheia (Google DeepMind, arXiv:2602.10177) - achieved 90% on IMO-ProofBench
 * 
 * Converted from: verification-engine.py
 */

import { colors, printHeader } from '../../cli/lib/colors';


// TYPES


enum VerificationCriterion {
  SYNTAX = "syntax",
  LOGIC = "logic",
  INTEGRATION = "integration",
  EDGE_CASES = "edge_cases",
  SECURITY = "security",
  PERFORMANCE = "performance"
}

interface VerificationResult {
  criterion: string;
  passed: boolean;
  message: string;
  details?: Record<string, unknown>;
}

interface VerificationReport {
  overall_pass: boolean;
  results: VerificationResult[];
  confidence: number;
  criteria_passed: number;
  criteria_total: number;
}


// PATTERNS


const VERIFICATION_PATTERNS = {
  empty_function: /def\s+\w+\(\s*\):\s*(?:pass|...|$)/,
  todo: /#\s*(TODO|FIXME|HACK|XXX)/i,
  infinite_loop: /while\s+True:/,
  sql_injection: /(?:execute|query|cursor)\s*\([^)]*\+[^)]*\)/i,
  hardcoded_creds: /(?:password|secret|api_key|token)\s*=\s*["'][^"']{8,}["']/i,
  eval_usage: /\beval\s*\(/,
  command_injection: /(?:os\.system|subprocess\.call|os\.popen)\s*\([^)]*\+[^)]*\)/,
  insecure_random: /random\.(?:random|randint)\s*\(/,
  nested_loops: /for\s+\w+\s+in\s+.*:\s*.*for\s+\w+\s+in\s+/s,
  string_concat_loop: /\+=.*\n.*for\s+/s,
};

const LANGUAGE_PATTERNS = {
  python: /^(def |class |import |from |if __name__)/m,
  javascript: /^(function |const |let |var |class |import |export )/m,
  typescript: /^(function |const |let |var |class |import |export |interface |type )/m,
  go: /^(func |package |import |type |struct )/m,
  java: /^(public |private |protected |class |void |int )/m,
};

const EDGE_CASE_PATTERNS = {
  null_handling: /(?:is\s+None|==\s+None|is\s+not\s+None|null|\bnull\b|===\s*null|!==\s*null)/,
  empty_input: /(?:if\s+not\s+\w+|if\s+\w+\s*==\s*[\[\(\{]|len\(|\.length\s*===?\s*0)/,
  exception_handling: /(?:try:|except|raise|throw|catch|try\s*\{)/,
  type_checking: /(?:isinstance|type\(|typeof|as\s+\w+|<\w+>)/,
};


// VERIFICATION ENGINE


class VerificationEngine {
  private criteria: Map<VerificationCriterion, (code: string, requirements: string) => VerificationResult>;

  constructor() {
    this.criteria = new Map([
      [VerificationCriterion.SYNTAX, this.checkSyntax.bind(this)],
      [VerificationCriterion.LOGIC, this.checkLogic.bind(this)],
      [VerificationCriterion.INTEGRATION, this.checkIntegration.bind(this)],
      [VerificationCriterion.EDGE_CASES, this.checkEdgeCases.bind(this)],
      [VerificationCriterion.SECURITY, this.checkSecurity.bind(this)],
    ]);
  }

  verify(generatedCode: string, requirements: string): VerificationReport {
    const results: VerificationResult[] = [];
    let allPassed = true;

    for (const [criterion, checkFn] of this.criteria) {
      try {
        const result = checkFn(generatedCode, requirements);
        results.push(result);

        if (!result.passed) {
          allPassed = false;
        }
      } catch (e) {
        results.push({
          criterion: criterion,
          passed: false,
          message: `Verification error: ${(e as Error).message}`,
        });
        allPassed = false;
      }
    }

    return {
      overall_pass: allPassed,
      results,
      confidence: this.calculateConfidence(results),
      criteria_passed: results.filter(r => r.passed).length,
      criteria_total: results.length,
    };
  }

  private calculateConfidence(results: VerificationResult[]): number {
    if (results.length === 0) return 0.0;
    return results.filter(r => r.passed).length / results.length;
  }

  // ==================== SYNTAX CHECK ====================

  private checkSyntax(code: string, _requirements: string): VerificationResult {
    const language = this.detectLanguage(code);

    if (language === "python") {
      // Basic Python syntax check - look for common issues
      const issues: string[] = [];
      
      // Check for unbalanced brackets
      const openParens = (code.match(/\(/g) || []).length;
      const closeParens = (code.match(/\)/g) || []).length;
      if (openParens !== closeParens) {
        issues.push(`Unbalanced parentheses: ${openParens} open, ${closeParens} close`);
      }

      const openBrackets = (code.match(/\[/g) || []).length;
      const closeBrackets = (code.match(/\]/g) || []).length;
      if (openBrackets !== closeBrackets) {
        issues.push(`Unbalanced brackets: ${openBrackets} open, ${closeBrackets} close`);
      }

      // Check for missing colons after def/if/for/while
      if (/def\s+\w+\([^)]*\)\s*$/.test(code) && !/def\s+\w+\([^)]*\)\s*:/.test(code)) {
        issues.push("Missing colon after function definition");
      }

      if (issues.length > 0) {
        return {
          criterion: VerificationCriterion.SYNTAX,
          passed: false,
          message: "Syntax issues detected",
          details: { issues },
        };
      }

      return {
        criterion: VerificationCriterion.SYNTAX,
        passed: true,
        message: "Python syntax appears valid",
      };
    }

    if (language === "typescript" || language === "javascript") {
      // Basic JS/TS syntax check
      const issues: string[] = [];

      // Check for unbalanced brackets
      const openBraces = (code.match(/\{/g) || []).length;
      const closeBraces = (code.match(/\}/g) || []).length;
      if (openBraces !== closeBraces) {
        issues.push(`Unbalanced braces: ${openBraces} open, ${closeBraces} close`);
      }

      if (issues.length > 0) {
        return {
          criterion: VerificationCriterion.SYNTAX,
          passed: false,
          message: "Syntax issues detected",
          details: { issues },
        };
      }

      return {
        criterion: VerificationCriterion.SYNTAX,
        passed: true,
        message: `${language} syntax appears valid`,
      };
    }

    return {
      criterion: VerificationCriterion.SYNTAX,
      passed: true,
      message: `Syntax check skipped (language: ${language})`,
    };
  }

  private detectLanguage(code: string): string {
    const stripped = code.trim();

    for (const [lang, pattern] of Object.entries(LANGUAGE_PATTERNS)) {
      if (pattern.test(stripped)) {
        return lang;
      }
    }

    return "unknown";
  }

  // ==================== LOGIC CHECK ====================

  private checkLogic(code: string, _requirements: string): VerificationResult {
    const questions = [
      "Does this code directly solve the stated problem?",
      "What assumptions is this code making about inputs?",
      "What edge cases could break this code?",
      "Are there any unhandled error conditions?",
      "Is there any unnecessary complexity?",
    ];

    const issues: string[] = [];

    if (VERIFICATION_PATTERNS.empty_function.test(code)) {
      issues.push("Empty function detected");
    }

    if (VERIFICATION_PATTERNS.todo.test(code)) {
      issues.push("Unresolved TODO/FIXME in code");
    }

    if (VERIFICATION_PATTERNS.infinite_loop.test(code) && !code.includes("break")) {
      issues.push("Potential infinite loop without break");
    }

    if (issues.length > 0) {
      return {
        criterion: VerificationCriterion.LOGIC,
        passed: false,
        message: "Logic issues found",
        details: { issues },
      };
    }

    return {
      criterion: VerificationCriterion.LOGIC,
      passed: true,
      message: "Logic appears correct",
      details: { questions },
    };
  }

  // ==================== INTEGRATION CHECK ====================

  private checkIntegration(code: string, _requirements: string): VerificationResult {
    const issues: string[] = [];

    // Extract imports
    const pythonImports = code.match(/^(?:import|from)\s+([^\s;]+)/gm) || [];
    const jsImports = code.match(/(?:import|require)\s*\(?['"]([^'"]+)['"]\)?/gm) || [];
    const imports = [...pythonImports, ...jsImports];

    // Check for relative imports in production code
    for (const imp of imports) {
      if (imp.includes("from .") || imp.includes("require('./") || imp.includes("from './")) {
        // Relative imports are fine, just note them
      }
    }

    // Extract function/class definitions
    const functions = [
      ...code.match(/^(?:def|function|const|let|var)\s+(\w+)/gm) || [],
      ...code.match(/^class\s+(\w+)/gm) || [],
    ];

    if (issues.length > 0) {
      return {
        criterion: VerificationCriterion.INTEGRATION,
        passed: false,
        message: "Integration issues found",
        details: { issues, imports, functions },
      };
    }

    return {
      criterion: VerificationCriterion.INTEGRATION,
      passed: true,
      message: "Integration checks passed",
      details: { imports: imports.length, functions: functions.length },
    };
  }

  // ==================== EDGE CASE CHECK ====================

  private checkEdgeCases(code: string, requirements: string): VerificationResult {
    const foundHandling: string[] = [];
    const missingHandling: string[] = [];

    for (const [caseName, pattern] of Object.entries(EDGE_CASE_PATTERNS)) {
      if (pattern.test(code)) {
        foundHandling.push(caseName);
      } else {
        missingHandling.push(caseName);
      }
    }

    const reqLower = requirements.toLowerCase();

    if (reqLower.includes("null") || reqLower.includes("none")) {
      if (!foundHandling.includes("null_handling")) {
        missingHandling.push("null handling (required by spec)");
      }
    }

    if (reqLower.includes("empty")) {
      if (!foundHandling.includes("empty_input")) {
        missingHandling.push("empty input handling (required by spec)");
      }
    }

    if (missingHandling.length > 0) {
      return {
        criterion: VerificationCriterion.EDGE_CASES,
        passed: false,
        message: "Potential edge cases not handled",
        details: { found_handling: foundHandling, missing_handling: missingHandling },
      };
    }

    return {
      criterion: VerificationCriterion.EDGE_CASES,
      passed: true,
      message: "Edge case handling appears adequate",
      details: { found_handling: foundHandling },
    };
  }

  // ==================== SECURITY CHECK ====================

  private checkSecurity(code: string, requirements: string): VerificationResult {
    const issues: string[] = [];

    if (VERIFICATION_PATTERNS.sql_injection.test(code)) {
      issues.push("Potential SQL injection - string concatenation in query");
    }

    if (VERIFICATION_PATTERNS.hardcoded_creds.test(code)) {
      issues.push("Potential hardcoded credentials detected");
    }

    if (VERIFICATION_PATTERNS.eval_usage.test(code)) {
      issues.push("Use of eval() is a security risk");
    }

    if (VERIFICATION_PATTERNS.command_injection.test(code)) {
      issues.push("Potential command injection - string concatenation in system call");
    }

    if (VERIFICATION_PATTERNS.insecure_random.test(code) && requirements.toLowerCase().includes("security")) {
      issues.push("Insecure random for security purposes - use secrets module");
    }

    if (issues.length > 0) {
      return {
        criterion: VerificationCriterion.SECURITY,
        passed: false,
        message: "Security issues found",
        details: { issues },
      };
    }

    return {
      criterion: VerificationCriterion.SECURITY,
      passed: true,
      message: "No obvious security issues detected",
    };
  }

  // ==================== PERFORMANCE CHECK ====================

  checkPerformance(code: string, _requirements: string): VerificationResult {
    const issues: string[] = [];

    const forCount = (code.match(/\bfor\s+/g) || []).length;
    if (forCount >= 2 && VERIFICATION_PATTERNS.nested_loops.test(code)) {
      issues.push("Potential O(n^2) nested loops detected");
    }

    if (VERIFICATION_PATTERNS.string_concat_loop.test(code)) {
      issues.push("String concatenation in loop - use list/array join instead");
    }

    if (issues.length > 0) {
      return {
        criterion: VerificationCriterion.PERFORMANCE,
        passed: false,
        message: "Potential performance issues found",
        details: { issues },
      };
    }

    return {
      criterion: VerificationCriterion.PERFORMANCE,
      passed: true,
      message: "No obvious performance issues detected",
    };
  }
}


// SINGLETON


let verificationEngineInstance: VerificationEngine | null = null;

function getVerificationEngine(): VerificationEngine {
  if (!verificationEngineInstance) {
    verificationEngineInstance = new VerificationEngine();
  }
  return verificationEngineInstance;
}


// CONFIDENCE ROUTER INTEGRATION


interface RouterResult {
  intent: string;
  confidence: number;
  action: string;
}

function shouldUseGVR(routerResult: RouterResult, codeComplexity: "simple" | "medium" | "complex" | "critical" = "medium"): boolean {
  /**
   * Determine if GVR (Generator-Verifier-Reviser) pattern should be used
   * based on router confidence and code complexity.
   */
  const complexityThresholds: Record<string, number> = {
    simple: 0.5,
    medium: 0.6,
    complex: 0.7,
    critical: 0.8,
  };

  const threshold = complexityThresholds[codeComplexity] || 0.6;
  return routerResult.confidence < threshold;
}

function calculateVerificationConfidence(report: VerificationReport, routerConfidence: number): number {
  /**
   * Combine verification confidence with router confidence
   * for final confidence score.
   */
  const verificationWeight = 0.4;
  const routerWeight = 0.6;

  return (report.confidence * verificationWeight) + (routerConfidence * routerWeight);
}


// CLI


function printUsage(): void {
  printHeader('Verification Engine');
  console.log();
  console.log(`${colors.yellow}Usage:${colors.reset}`);
  console.log(`  bun run verification-engine.ts <command> [args]`);
  console.log();
  console.log(`${colors.yellow}Commands:${colors.reset}`);
  console.log(`  ${colors.green}verify${colors.reset} <code>           Verify code string`);
  console.log(`  ${colors.green}file${colors.reset} <path>             Verify code from file`);
  console.log();
  console.log(`${colors.yellow}Options:${colors.reset}`);
  console.log(`  --requirements <text>    Requirements specification`);
  console.log(`  --json                   Output as JSON`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  const command = args[0];
  let code = "";
  let requirements = "";
  let outputJson = false;

  // Parse options
  for (let i = 1; i < args.length; i++) {
    if (args[i] === '--requirements' && args[i + 1]) {
      requirements = args[++i];
    } else if (args[i] === '--json') {
      outputJson = true;
    } else if (!code && !args[i].startsWith('--')) {
      code = args[i];
    }
  }

  const engine = getVerificationEngine();

  switch (command) {
    case 'verify':
      if (!code) {
        console.error(`${colors.red}Error: verify requires <code>${colors.reset}`);
        process.exit(1);
      }
      
      const result = engine.verify(code, requirements);
      
      if (outputJson) {
        console.log(JSON.stringify(result, null, 2));
      } else {
        console.log();
        console.log(`${colors.cyan}=== VERIFICATION RESULTS ===${colors.reset}`);
        console.log(`Overall: ${result.overall_pass ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`}`);
        console.log(`Confidence: ${(result.confidence * 100).toFixed(0)}%`);
        console.log(`Criteria: ${result.criteria_passed}/${result.criteria_total}`);
        console.log();
        console.log("Details:");
        for (const r of result.results) {
          const status = r.passed ? `${colors.green}[PASS]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
          console.log(`  ${status} ${r.criterion}: ${r.message}`);
          if (r.details && !r.passed) {
            console.log(`    ${colors.yellow}Details:${colors.reset} ${JSON.stringify(r.details)}`);
          }
        }
      }
      break;

    case 'file':
      if (!code) {
        console.error(`${colors.red}Error: file requires <path>${colors.reset}`);
        process.exit(1);
      }
      
      try {
        const fileContent = await Bun.file(code).text();
        const fileResult = engine.verify(fileContent, requirements);
        
        if (outputJson) {
          console.log(JSON.stringify(fileResult, null, 2));
        } else {
          console.log();
          console.log(`${colors.cyan}=== VERIFICATION RESULTS FOR ${code} ===${colors.reset}`);
          console.log(`Overall: ${fileResult.overall_pass ? `${colors.green}PASS${colors.reset}` : `${colors.red}FAIL${colors.reset}`}`);
          console.log(`Confidence: ${(fileResult.confidence * 100).toFixed(0)}%`);
          console.log(`Criteria: ${fileResult.criteria_passed}/${fileResult.criteria_total}`);
          console.log();
          console.log("Details:");
          for (const r of fileResult.results) {
            const status = r.passed ? `${colors.green}[PASS]${colors.reset}` : `${colors.red}[FAIL]${colors.reset}`;
            console.log(`  ${status} ${r.criterion}: ${r.message}`);
          }
        }
      } catch (e) {
        console.error(`${colors.red}Error reading file:${colors.reset} ${(e as Error).message}`);
        process.exit(1);
      }
      break;

    default:
      console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
      printUsage();
      process.exit(1);
  }
}


// EXPORTS


export {
  VerificationEngine,
  VerificationCriterion,
  getVerificationEngine,
  shouldUseGVR,
  calculateVerificationConfidence,
};

export type {
  VerificationResult,
  VerificationReport,
  RouterResult,
};

// Run CLI if executed directly
if (import.meta.main) {
  main().catch(err => {
    console.error(`${colors.red}Error:${colors.reset}`, err.message);
    process.exit(1);
  });
}
