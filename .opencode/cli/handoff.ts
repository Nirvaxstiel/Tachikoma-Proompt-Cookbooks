#!/usr/bin/env bun
/**
 * Handoff Manager
 * Creates and restores handoff documents for session breaks
 *
 * Converted from pause-handoff.sh and resume-handoff.sh
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  writeFileSync,
  readdirSync,
} from "node:fs";
import { join, basename } from "node:path";
import {
  colors,
  printHeader,
  printSuccess,
  printError,
  printWarning,
} from "./lib/colors";
import {
  HANDOFF_TEMPLATE,
  fillTemplate,
  getTimestamp,
  getIsoTimestamp,
} from "./lib/templates";

// PATHS

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, "..");
const TACHIKOMA_DIR = join(OPENCODE_DIR, "agents", "tachikoma");
const STATE_FILE = join(OPENCODE_DIR, "STATE.md");
const HANDOFF_DIR = join(TACHIKOMA_DIR, "handoffs");
const SPEC_DIR = join(TACHIKOMA_DIR, "spec");

// PAUSE (CREATE HANDOFF)

function createHandoff(reason: string): number {
  if (!existsSync(STATE_FILE)) {
    printError("STATE.md not found. No state to handoff.");
    return 1;
  }

  // Ensure handoff directory exists
  mkdirSync(HANDOFF_DIR, { recursive: true });

  const stateContent = readFileSync(STATE_FILE, "utf-8");
  const timestamp = getIsoTimestamp().replace(/[:.]/g, "-").slice(0, 19);
  const filename = `HANDOFF-${timestamp}.md`;
  const handoffPath = join(HANDOFF_DIR, filename);

  // Parse state
  const taskMatch = stateContent.match(/\*\*Task\*\*:\s*(\S+)/);
  const phaseMatch = stateContent.match(/\*\*Phase\*\*:\s*(\S+)/);
  const statusMatch = stateContent.match(/\*\*Status\*\*:\s*(\S+)/);

  const taskSlug = taskMatch ? taskMatch[1] : "unknown";
  const phase = phaseMatch ? phaseMatch[1] : "unknown";
  const status = statusMatch ? statusMatch[1] : "unknown";

  // Get accomplishments (simplified - just grab last activity)
  const lastActivityMatch = stateContent.match(/\*\*Last activity\*\*:\s*(.+)/);
  const accomplishments = lastActivityMatch
    ? `- ${lastActivityMatch[1]}`
    : "- No activity logged";

  // Get decisions
  const decisionsMatch = stateContent.match(/### Decisions[\s\S]*?\n\n---/);
  const decisions = decisionsMatch ? decisionsMatch[0] : "No decisions logged";

  // Extract decisions table rows
  const decisionRows: string[] = [];
  const decisionRegex = /\| (.+?) \| (.+?) \| (.+?) \|/g;
  let match;
  const decisionsSection = stateContent.match(/### Decisions[\s\S]*?\n---/);
  if (decisionsSection) {
    while ((match = decisionRegex.exec(decisionsSection[0])) !== null) {
      if (match[1] !== "Decision" && !match[1].includes("*No")) {
        decisionRows.push(`| ${match[1]} | ${match[2]} | ${match[3]} |`);
      }
    }
  }

  // Get deferred issues
  const deferredRows: string[] = [];
  const deferredSection = stateContent.match(
    /### Deferred Issues[\s\S]*?\n---/,
  );
  if (deferredSection) {
    const deferredRegex = /\| (.+?) \| (.+?) \| (.+?) \| (.+?) \|/g;
    while ((match = deferredRegex.exec(deferredSection[0])) !== null) {
      if (match[1] !== "Issue" && !match[1].includes("*No")) {
        deferredRows.push(
          `| ${match[1]} | ${match[2]} | ${match[3]} | ${match[4]} |`,
        );
      }
    }
  }

  // Get blockers
  const blockerRows: string[] = [];
  const blockerSection = stateContent.match(/### Blockers[\s\S]*?\n---/);
  if (blockerSection) {
    const blockerRegex = /\| (.+?) \| (.+?) \| (.+?) \|/g;
    while ((match = blockerRegex.exec(blockerSection[0])) !== null) {
      if (match[1] !== "Blocker" && !match[1].includes("*No")) {
        blockerRows.push(`| ${match[1]} | ${match[2]} | ${match[3]} |`);
      }
    }
  }

  // Get next action from session continuity
  const nextActionMatch = stateContent.match(/\*\*Next action\*\*:\s*(.+)/);
  const nextAction = nextActionMatch
    ? nextActionMatch[1]
    : "Review STATE.md for current position";

  // Read task spec if exists
  let inProgress = "No tasks.md found for current task";
  const tasksFile = join(SPEC_DIR, taskSlug, "tasks.md");
  if (existsSync(tasksFile)) {
    const tasksContent = readFileSync(tasksFile, "utf-8");
    // Find incomplete tasks
    const incompleteTasks = tasksContent
      .split("\n")
      .filter((line) => line.includes("- [ ]"))
      .slice(0, 5)
      .join("\n");
    if (incompleteTasks) {
      inProgress = incompleteTasks;
    }
  }

  // Create handoff content
  const values = {
    timestamp: getTimestamp(),
    reason: reason || "Session break",
    taskSlug,
    currentTask: taskSlug,
    currentPhase: phase,
    currentStatus: status,
    accomplishments,
    inProgress,
    decisions:
      decisionRows.length > 0 ? decisionRows.join("\n") : "No decisions",
    decisionsTable:
      decisionRows.length > 0
        ? decisionRows.join("\n")
        : "| *No decisions yet* | - | - |",
    deferredTable:
      deferredRows.length > 0
        ? deferredRows.join("\n")
        : "| *No deferred issues* | - | - | - |",
    blockersTable:
      blockerRows.length > 0
        ? blockerRows.join("\n")
        : "| *No active blockers* | - | - |",
    nextAction,
    resumeContext: `- Task: ${taskSlug}\n- Phase: ${phase}\n- See STATE.md for full context`,
    filesModified: "- See git status for modified files",
  };

  const handoffContent = fillTemplate(HANDOFF_TEMPLATE, values);
  writeFileSync(handoffPath, handoffContent);

  // Update STATE.md session continuity
  updateStateForHandoff(filename, nextAction);

  // Output
  printHeader("Creating Handoff Document");
  console.log();
  console.log(
    `Reason: ${colors.green}${reason || "Session break"}${colors.reset}`,
  );
  console.log(`Task slug: ${colors.green}${taskSlug}${colors.reset}`);
  console.log();
  printSuccess(`Reading STATE.md...`);
  printSuccess(`Handoff created`);
  console.log();
  console.log(`Handoff file: ${colors.green}${handoffPath}${colors.reset}`);
  console.log();
  printHeader("Handoff Complete");
  console.log();
  printWarning(`To resume from this handoff:`);
  console.log(`  bun run .opencode/cli/handoff.ts resume ${filename}`);
  console.log();

  return 0;
}

function updateStateForHandoff(handoffFile: string, nextAction: string): void {
  if (!existsSync(STATE_FILE)) return;

  let content = readFileSync(STATE_FILE, "utf-8");
  const timestamp = getTimestamp();

  // Update session continuity
  content = content.replace(
    /\*\*Last session\*\*:.*?\n/,
    `**Last session**: ${timestamp}\n`,
  );
  content = content.replace(
    /\*\*Stopped at\*\*:.*?\n/,
    `**Stopped at**: Handoff created\n`,
  );
  content = content.replace(
    /\*\*Next action\*\*:.*?\n/,
    `**Next action**: ${nextAction}\n`,
  );
  content = content.replace(
    /\*\*Resume context\*\*:.*?\n/,
    `**Resume context**: See handoffs/${handoffFile}\n`,
  );

  writeFileSync(STATE_FILE, content);
}

// RESUME (RESTORE FROM HANDOFF)

function resumeFromHandoff(handoffFile?: string): number {
  if (!existsSync(HANDOFF_DIR)) {
    printError("No handoffs directory found");
    return 1;
  }

  // Find handoff file
  let handoffPath: string;

  if (handoffFile) {
    handoffPath =
      handoffFile.includes("/") || handoffFile.includes("\\")
        ? handoffFile
        : join(HANDOFF_DIR, handoffFile);
  } else {
    // Find most recent handoff
    const files = readdirSync(HANDOFF_DIR)
      .filter((f) => f.startsWith("HANDOFF-") && f.endsWith(".md"))
      .sort()
      .reverse();

    if (files.length === 0) {
      printError("No handoff files found");
      return 1;
    }

    handoffPath = join(HANDOFF_DIR, files[0]);
  }

  if (!existsSync(handoffPath)) {
    printError(`Handoff file not found: ${handoffPath}`);
    return 1;
  }

  const handoffContent = readFileSync(handoffPath, "utf-8");

  printHeader("Resume from Handoff");
  console.log();
  console.log(`Handoff file: ${colors.green}${handoffPath}${colors.reset}`);
  console.log();
  printWarning("Reading handoff...");
  console.log();
  console.log(handoffContent);
  console.log();
  printHeader("Recommended Next Action");
  console.log();

  // Extract next action from handoff
  const nextActionMatch = handoffContent.match(/## Next Action\s*\n\s*(.+)/s);
  if (nextActionMatch) {
    console.log(
      colors.green + nextActionMatch[1].split("\n")[0] + colors.reset,
    );
  } else {
    console.log("Review handoff document above for context and next action");
  }
  console.log();

  return 0;
}

// CLI

function printUsage(): void {
  console.log(`
Handoff Manager - Create and restore session handoffs

Usage:
  bun run handoff.ts pause [reason]    Create handoff for session break
  bun run handoff.ts resume [file]     Restore from handoff

Commands:
  pause [reason]    Create handoff document with current state
  resume [file]     Resume from handoff (uses most recent if no file)

Examples:
  bun run handoff.ts pause
  bun run handoff.ts pause "switching to other project"
  bun run handoff.ts resume
  bun run handoff.ts resume HANDOFF-2026-02-22T12-00-00.md
`);
}

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === "--help" || args[0] === "-h") {
  printUsage();
  process.exit(0);
}

const command = args[0];
const cmdArgs = args.slice(1);

switch (command) {
  case "pause":
    process.exit(createHandoff(cmdArgs.join(" ")));
  case "resume":
    process.exit(resumeFromHandoff(cmdArgs[0]));
  default:
    printError(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
