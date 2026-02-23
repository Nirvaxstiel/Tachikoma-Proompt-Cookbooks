#!/usr/bin/env bun
/**
 * Skill Composer Router
 * Decomposes tasks and sequences skills optimally
 * Usage: bun run router.ts <operation> [args]
 */

import { existsSync, readdirSync, readFileSync, appendFileSync, mkdirSync } from "fs";
import { join, basename } from "path";

// Colors
const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  cyan: "\x1b[0;36m",
  reset: "\x1b[0m",
};

const SKILLS_DIR = ".opencode/skills";
const COMPOSITION_LOG = ".tmp/skill-compositions.log";

function printHeader(text: string) {
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.cyan}${text}${colors.reset}`);
  console.log(`${colors.cyan}══════════════════════════════════════════════════════════${colors.reset}`);
}

function printSuccess(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function printWarning(msg: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function printInfo(msg: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

// Discover available skills
function opDiscover() {
  printHeader("SKILL COMPOSER: Available Skills");

  if (!existsSync(SKILLS_DIR)) {
    printWarning(`Skills directory not found: ${SKILLS_DIR}`);
    process.exit(1);
  }

  console.log("");
  console.log("Registered skills:");
  console.log("");

  const skills = readdirSync(SKILLS_DIR, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  let count = 0;
  for (const skill of skills) {
    const skillFile = join(SKILLS_DIR, skill, "SKILL.md");
    if (existsSync(skillFile)) {
      const content = readFileSync(skillFile, "utf-8");
      const descMatch = content.match(/^description:\s*"?([^"\n]+)"?/m);
      const desc = descMatch ? descMatch[1] : "";

      console.log(`  • ${skill}`);
      if (desc) console.log(`    ${desc}`);
      count++;
    }
  }

  console.log("");
  printSuccess(`Found ${count} skills`);
  console.log("");
  console.log("These skills can be composed for complex tasks.");
}

// Decompose a task into skill sequence
function opDecompose(task: string) {
  printHeader("SKILL COMPOSER: Task Decomposition");

  if (!task) {
    printWarning("No task provided");
    console.log("Usage: decompose '<task description>'");
    process.exit(1);
  }

  console.log(`Task: ${task}`);
  console.log("");

  // Simple rule-based decomposition
  const steps: { order: number; skill: string; desc: string }[] = [];

  // Detect patterns
  if (/research|find|look up|investigate/i.test(task)) {
    steps.push({ order: 1, skill: "research-agent", desc: "Find information" });
  }

  if (/implement|code|write|create|build/i.test(task)) {
    steps.push({ order: 2, skill: "code-agent", desc: "Write code" });
  }

  if (/review|audit|check|analyze.*code/i.test(task)) {
    steps.push({ order: 2, skill: "analysis-agent", desc: "Review code" });
  }

  if (/document|doc|readme/i.test(task)) {
    steps.push({ order: 3, skill: "docs", desc: "Write documentation" });
  }

  if (/format|clean|lint|prettify/i.test(task)) {
    steps.push({ order: 3, skill: "formatter", desc: "Clean up code" });
  }

  if (/commit|git/i.test(task)) {
    steps.push({ order: 4, skill: "git-commit", desc: "Commit changes" });
  }

  if (/api|library|framework|docs.*external/i.test(task)) {
    // Insert context7 early if research is also needed
    if (steps.some(s => s.skill === "research-agent")) {
      steps.unshift({ order: 1, skill: "context7", desc: "Fetch live docs" });
    } else {
      steps.push({ order: 1, skill: "context7", desc: "Fetch live docs" });
    }
  }

  // If no specific skills detected, suggest general composition
  if (steps.length === 0) {
    printWarning("Could not auto-detect skills for this task");
    console.log("");
    console.log("Suggested composition:");
    console.log("  1. intent-classifier: Determine exact intent");
    console.log("  2. research-agent: Gather information");
    console.log("  3. code-agent: Implement solution");
    console.log("  4. formatter: Clean up");
    return;
  }

  console.log("Detected skill composition:");
  console.log("");

  const sorted = steps.sort((a, b) => a.order - b.order);
  for (const step of sorted) {
    console.log(`  Step ${step.order}: ${step.skill}`);
    console.log(`    Purpose: ${step.desc}`);
    console.log("");
  }

  console.log("");
  printSuccess("Decomposition complete");
  console.log("");
  console.log("To execute this composition, Tachikoma will:");
  console.log("  1. Load each skill in sequence");
  console.log("  2. Pass state between skills");
  console.log("  3. Synthesize final output");
}

// Show example compositions
function opExamples() {
  printHeader("SKILL COMPOSER: Example Compositions");

  console.log("");
  console.log("Example 1: Feature Implementation");
  console.log("─────────────────────────────────────");
  console.log("Task: 'Add OAuth2 authentication'");
  console.log("");
  console.log("Composition:");
  console.log("  1. context7: Fetch OAuth2 spec");
  console.log("  2. research-agent: Check project auth patterns");
  console.log("  3. code-agent: Implement OAuth2 middleware");
  console.log("  4. formatter: Clean up code");
  console.log("  5. git-commit: Commit changes");
  console.log("");

  console.log("Example 2: Comprehensive Code Review");
  console.log("─────────────────────────────────────");
  console.log("Task: 'Review this PR thoroughly'");
  console.log("");
  console.log("Composition (parallel):");
  console.log("  1. analysis-agent: Security audit");
  console.log("  2. analysis-agent: Performance analysis");
  console.log("  3. analysis-agent: Code quality check");
  console.log("  4. [Synthesis]: Merge findings");
  console.log("  5. pr: Create review comments");
  console.log("");

  console.log("Example 3: Documentation Sprint");
  console.log("─────────────────────────────────────");
  console.log("Task: 'Document the new API endpoints'");
  console.log("");
  console.log("Composition:");
  console.log("  1. context-manager: Discover existing docs structure");
  console.log("  2. research-agent: Analyze API code");
  console.log("  3. code-agent: Generate OpenAPI spec");
  console.log("  4. formatter: Format documentation");
  console.log("  5. git-commit: Commit docs");
  console.log("");

  printSuccess("Use 'decompose <task>' to see composition for your task");
}

// Log a composition
function opLog(task: string, composition: string) {
  const logDir = join(COMPOSITION_LOG, "..");
  if (!existsSync(logDir)) {
    mkdirSync(logDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);
  appendFileSync(COMPOSITION_LOG, `[${timestamp}] Task: ${task}\nComposition: ${composition}\n---\n`);

  printSuccess("Composition logged");
}

// Show composition history
function opHistory() {
  printHeader("SKILL COMPOSER: Composition History");

  if (!existsSync(COMPOSITION_LOG)) {
    printInfo("No composition history found");
    return;
  }

  console.log("");
  const content = readFileSync(COMPOSITION_LOG, "utf-8");
  const lines = content.split("\n").slice(-50);
  console.log(lines.join("\n"));
}

// Help
function opHelp() {
  console.log("Skill Composer - Dynamically compose skills for complex tasks");
  console.log("");
  console.log("Usage: bun run router.ts <operation> [args]");
  console.log("");
  console.log("Operations:");
  console.log("  discover              List all available skills");
  console.log("  decompose '<task>'    Decompose task into skill sequence");
  console.log("  examples              Show example compositions");
  console.log("  history               Show composition history");
  console.log("  help                  Show this help");
  console.log("");
  console.log("Examples:");
  console.log("  bun run router.ts discover");
  console.log("  bun run router.ts decompose 'Research React 19 and implement demo'");
  console.log("  bun run router.ts examples");
}

// Main
const args = process.argv.slice(2);
const op = args[0] || "help";

switch (op) {
  case "discover":
    opDiscover();
    break;
  case "decompose":
    opDecompose(args.slice(1).join(" "));
    break;
  case "examples":
    opExamples();
    break;
  case "history":
    opHistory();
    break;
  case "log":
    opLog(args[1], args[2]);
    break;
  case "help":
  case "--help":
  case "-h":
    opHelp();
    break;
  default:
    console.log(`${colors.red}Unknown operation: ${op}${colors.reset}`);
    console.log("Run 'bun run router.ts help' for usage");
    process.exit(1);
}
