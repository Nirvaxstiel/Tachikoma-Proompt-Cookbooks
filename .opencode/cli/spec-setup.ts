#!/usr/bin/env bun

import { parseArgs } from "node:util";
import { existsSync, mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  TODO_TEMPLATE,
  SPEC_TEMPLATE,
  DESIGN_TEMPLATE,
  TASKS_TEMPLATE,
  BOUNDARIES_TEMPLATE,
  STATE_TEMPLATE,
  fillTemplate,
  generateSlug,
  getTimestamp,
} from "./lib/templates";
import { colors, printHeader, printSuccess, printWarning } from "./lib/colors";

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, "..");
const TACHIKOMA_DIR = join(OPENCODE_DIR, "agents", "tachikoma");
const SPEC_DIR = join(TACHIKOMA_DIR, "spec");
const STATE_FILE = join(OPENCODE_DIR, "STATE.md");

interface TaskComplexity {
  level: "simple" | "medium" | "complex";
  confidence: number;
  reason: string;
  estimatedTokens: number;
}

function estimateTaskComplexity(taskName: string): TaskComplexity {
  const wordCount = taskName.split(/\s+/).length;
  const simpleKeywords = [
    "list",
    "check",
    "find",
    "show",
    "read",
    "display",
    "get",
    "explain briefly",
    "syntax",
  ];
  const complexKeywords = [
    "implement",
    "refactor",
    "architecture",
    "system",
    "framework",
    "comprehensive",
    "full analysis",
    "multi-file",
    "complex",
  ];

  const hasSimpleKeyword = simpleKeywords.some((kw) =>
    taskName.toLowerCase().includes(kw),
  );
  const hasComplexKeyword = complexKeywords.some((kw) =>
    taskName.toLowerCase().includes(kw),
  );

  let level: "simple" | "medium" | "complex";
  let reason: string;
  let estimatedTokens: number;

  if (hasComplexKeyword) {
    level = "complex";
    reason = "Contains complex keyword";
    estimatedTokens = 1500;
  } else if (hasSimpleKeyword || wordCount < 50) {
    level = "simple";
    reason = hasSimpleKeyword
      ? "Contains simple keyword"
      : `Short description (${wordCount} words)`;
    estimatedTokens = 200;
  } else if (wordCount < 200) {
    level = "medium";
    reason = `Moderate description (${wordCount} words)`;
    estimatedTokens = 900;
  } else {
    level = "complex";
    reason = `Long description (${wordCount} words)`;
    estimatedTokens = 1500;
  }

  return {
    level,
    confidence: 0.85,
    reason,
    estimatedTokens,
  };
}

function createSpecFolder(
  taskName: string,
  options: { fullSpec?: boolean } = {},
): number {
  if (!taskName) {
    console.error('Usage: bun run spec-setup.ts "<task-name>"');
    return 1;
  }

  const slug = generateSlug(taskName);
  const sessionDir = join(SPEC_DIR, slug);
  const reportsDir = join(sessionDir, "reports");

  printHeader("Spec Session Created");
  console.log();

  // Check if already exists
  if (existsSync(sessionDir)) {
    printWarning(`Spec folder already exists: ${sessionDir}`);
    console.log("Will update files...\n");
  }

  // Create directories
  mkdirSync(sessionDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });

  // Estimate complexity unless --full-spec is set
  let complexity: TaskComplexity | null = null;
  if (!options.fullSpec) {
    complexity = estimateTaskComplexity(taskName);
    console.log(
      `Task complexity: ${colors.cyan}${complexity.level.toUpperCase()}${colors.reset}`,
    );
    console.log(`Reason: ${complexity.reason}`);
    console.log(`Estimated tokens: ${complexity.estimatedTokens}\n`);
  }

  // Template values
  const values = {
    taskName,
    slug,
    timestamp: getTimestamp(),
  };

  // Determine which files to create based on complexity
  let files: [string, string][];

  if (options.fullSpec || (complexity && complexity.level === "complex")) {
    // Full spec for --full-spec flag or complex tasks
    files = [
      ["todo.md", fillTemplate(TODO_TEMPLATE, values)],
      ["SPEC.md", fillTemplate(SPEC_TEMPLATE, values)],
      ["design.md", fillTemplate(DESIGN_TEMPLATE, values)],
      ["tasks.md", fillTemplate(TASKS_TEMPLATE, values)],
      ["boundaries.md", fillTemplate(BOUNDARIES_TEMPLATE, values)],
    ];
  } else if (complexity && complexity.level === "medium") {
    // Medium: todo.md + SPEC.md only
    files = [
      ["todo.md", fillTemplate(TODO_TEMPLATE, values)],
      ["SPEC.md", fillTemplate(SPEC_TEMPLATE, values)],
    ];
  } else {
    // Simple: todo.md only
    files = [["todo.md", fillTemplate(TODO_TEMPLATE, values)]];
  }

  for (const [filename, content] of files) {
    writeFileSync(join(sessionDir, filename), content);
  }

  // Output info
  console.log(`Task: ${colors.green}${taskName}${colors.reset}`);
  console.log(`Slug: ${colors.green}${slug}${colors.reset}`);
  console.log(`Folder: ${colors.green}${sessionDir}${colors.reset}`);
  console.log();
  console.log("Files created:");
  for (const [filename] of files) {
    const extra =
      filename === "SPEC.md" ? " (with BDD acceptance criteria)" : "";
    const extra2 =
      filename === "boundaries.md" ? " (protected files/patterns)" : "";
    console.log(
      `  ${colors.green}├── ${filename}${colors.reset}${extra}${extra2}`,
    );
  }
  console.log(`  ${colors.green}└── reports/${colors.reset}`);

  // Show savings
  if (complexity && !options.fullSpec) {
    const fullSpecTokens = 1500; // Typical full spec
    const savedTokens = fullSpecTokens - complexity.estimatedTokens;
    const savingsPercent = Math.round((savedTokens / fullSpecTokens) * 100);
    console.log();
    console.log(
      `${colors.green}Token savings: ~${savedTokens} tokens (${savingsPercent}% reduction)${colors.reset}\n`,
    );
  }

  // Initialize or update STATE.md
  if (!existsSync(STATE_FILE)) {
    writeFileSync(STATE_FILE, fillTemplate(STATE_TEMPLATE, values));
    console.log(`${colors.green}[+]${colors.reset} Created STATE.md`);
  } else {
    updateStateMd(slug, taskName, complexity?.level);
    printSuccess("STATE.md already exists, will update");
  }

  console.log();
  printWarning(
    `Remember: Save artifacts to .opencode/agents/tachikoma/spec/${slug}/reports/`,
  );
  printWarning("Update .opencode/STATE.md when task starts/completes");
  console.log();

  return 0;
}

function updateStateMd(
  slug: string,
  taskName: string,
  complexity?: "simple" | "medium" | "complex",
): void {
  if (!existsSync(STATE_FILE)) return;

  let content = readFileSync(STATE_FILE, "utf-8");
  const timestamp = getTimestamp();

  // Update current position
  content = content.replace(
    /\*\*Task\*\*:.*?\|.*?\*\*Phase\*\*:.*?\|.*?\*\*Status\*\*:.*?\n/,
    `**Task**: ${slug} | **Phase**: Planning | **Status**: Planning\n`,
  );

  // Update last activity
  const complexityInfo = complexity ? ` (${complexity} complexity)` : "";
  content = content.replace(
    /\*\*Last activity\*\*:.*?\n/,
    `**Last activity**: ${timestamp} — Task "${taskName}" initialized${complexityInfo}\n`,
  );

  // Update session continuity
  content = content.replace(
    /\*\*Last session\*\*:.*?\n/,
    `**Last session**: ${timestamp}\n`,
  );
  content = content.replace(
    /\*\*Next action\*\*:.*?\n/,
    `**Next action**: Fill in SPEC.md requirements and approach\n`,
  );
  content = content.replace(
    /\*\*Resume context\*\*:.*?\n/,
    `**Resume context**: New task "${slug}" initialized, ready for planning\n`,
  );

  writeFileSync(STATE_FILE, content);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  console.log(
    "\n" +
      "Spec Session Setup - Create task spec folder\n\n" +
      "Usage:\n" +
      '  bun run spec-setup.ts "<task-name>" [--full-spec]\n\n' +
      "Arguments:\n" +
      "  task-name    Name of the task (will be converted to slug)\n" +
      "  --full-spec  Force creation of all 5 spec files\n\n" +
      "Examples:\n" +
      '  bun run spec-setup.ts "fix auth bug"\n' +
      '  bun run spec-setup.ts "Add OAuth login to app"\n' +
      '  bun run spec-setup.ts "Implement comprehensive system" --full-spec\n',
  );
  process.exit(0);
}

const fullSpecIndex = args.indexOf("--full-spec");
const hasFullSpec = fullSpecIndex !== -1;
const taskName = args.filter((arg) => arg !== "--full-spec").join(" ");

process.exit(createSpecFolder(taskName, { fullSpec: hasFullSpec }));
