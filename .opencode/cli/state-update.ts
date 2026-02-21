#!/usr/bin/env bun
/**
 * STATE.md Updater
 * Helper script to update STATE.md with task information
 * 
 * Converted from state-update.sh
 */

import { existsSync, readFileSync, writeFileSync, appendFileSync } from 'node:fs';
import { join } from 'node:path';
import { colors, printHeader, printSuccess, printError, printWarning } from './lib/colors';
import { getTimestamp } from './lib/templates';

// =============================================================================
// PATHS
// =============================================================================

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, '..');
const TACHIKOMA_DIR = join(OPENCODE_DIR, 'agents', 'tachikoma');
const STATE_FILE = join(OPENCODE_DIR, 'STATE.md');

// =============================================================================
// COMMANDS
// =============================================================================

function cmdStartTask(slug: string): number {
  if (!slug) {
    printError('Usage: state-update.ts start-task <slug>');
    return 1;
  }

  if (!existsSync(STATE_FILE)) {
    printError('STATE.md not found. Run spec-setup.ts first.');
    return 1;
  }

  let content = readFileSync(STATE_FILE, 'utf-8');
  const timestamp = getTimestamp();

  content = content.replace(
    /\*\*Task\*\*:.*?\|.*?\*\*Phase\*\*:.*?\|.*?\*\*Status\*\*:.*?\n/,
    `**Task**: ${slug} | **Phase**: Executing | **Status**: Executing\n`
  );

  content = content.replace(
    /\*\*Last activity\*\*:.*?\n/,
    `**Last activity**: ${timestamp} — Started execution\n`
  );

  writeFileSync(STATE_FILE, content);
  printSuccess(`Updated STATE.md: started task ${slug}`);
  return 0;
}

function cmdCompleteTask(slug: string, duration: string): number {
  if (!slug) {
    printError('Usage: state-update.ts complete-task <slug> [duration]');
    return 1;
  }

  if (!existsSync(STATE_FILE)) {
    printError('STATE.md not found. Run spec-setup.ts first.');
    return 1;
  }

  let content = readFileSync(STATE_FILE, 'utf-8');
  const timestamp = getTimestamp();
  const dur = duration || '0';

  content = content.replace(
    /\*\*Task\*\*:.*?\|.*?\*\*Phase\*\*:.*?\|.*?\*\*Status\*\*:.*?\n/,
    `**Task**: ${slug} | **Phase**: Complete | **Status**: Complete\n`
  );

  content = content.replace(
    /\*\*Last activity\*\*:.*?\n/,
    `**Last activity**: ${timestamp} — Task completed (${dur} min)\n`
  );

  // Update velocity metrics (simple increment)
  const totalMatch = content.match(/\*\*Total tasks completed\*\*:\s*(\d+)/);
  if (totalMatch) {
    const total = parseInt(totalMatch[1]) + 1;
    content = content.replace(
      /\*\*Total tasks completed\*\*:\s*\d+/,
      `**Total tasks completed**: ${total}`
    );
  }

  writeFileSync(STATE_FILE, content);
  printSuccess(`Updated STATE.md: completed task ${slug}`);
  return 0;
}

function cmdAddDecision(slug: string, decision: string, impact: string): number {
  if (!slug || !decision) {
    printError('Usage: state-update.ts add-decision <slug> <decision> [impact]');
    return 1;
  }

  if (!existsSync(STATE_FILE)) {
    printError('STATE.md not found. Run spec-setup.ts first.');
    return 1;
  }

  let content = readFileSync(STATE_FILE, 'utf-8');
  const timestamp = getTimestamp();
  const imp = impact || 'Medium';

  // Find decisions table and add entry
  const decisionRow = `| ${decision} | ${slug} | ${imp} |\n`;
  
  // Find the marker for new decisions
  const marker = '| *No decisions yet* | - | - |';
  if (content.includes(marker)) {
    content = content.replace(marker, decisionRow);
  } else {
    // Append after the header
    content = content.replace(
      /\| Decision \| Task \| Impact \|(\n\|---+\|---+\|---+\|)/,
      `| Decision | Task | Impact |$1\n${decisionRow}`
    );
  }

  writeFileSync(STATE_FILE, content);
  printSuccess(`Added decision to STATE.md`);
  return 0;
}

function cmdAddBlocker(blocker: string, impact: string, resolution: string): number {
  if (!blocker) {
    printError('Usage: state-update.ts add-blocker <blocker> [impact] [resolution]');
    return 1;
  }

  if (!existsSync(STATE_FILE)) {
    printError('STATE.md not found. Run spec-setup.ts first.');
    return 1;
  }

  let content = readFileSync(STATE_FILE, 'utf-8');
  const imp = impact || 'High';
  const res = resolution || 'TBD';

  const blockerRow = `| ${blocker} | ${imp} | ${res} |\n`;
  
  const marker = '| *No active blockers* | - | - |';
  if (content.includes(marker)) {
    content = content.replace(marker, blockerRow);
  } else {
    content = content.replace(
      /\| Blocker \| Impact \| Resolution Path \|(\n\|---+\|---+\|---+\|)/,
      `| Blocker | Impact | Resolution Path |$1\n${blockerRow}`
    );
  }

  writeFileSync(STATE_FILE, content);
  printSuccess(`Added blocker to STATE.md`);
  return 0;
}

function cmdResolveBlocker(blocker: string): number {
  if (!blocker) {
    printError('Usage: state-update.ts resolve-blocker <blocker>');
    return 1;
  }

  if (!existsSync(STATE_FILE)) {
    printError('STATE.md not found. Run spec-setup.ts first.');
    return 1;
  }

  let content = readFileSync(STATE_FILE, 'utf-8');

  // Remove the blocker row
  const regex = new RegExp(`\\| ${blocker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')} \\|.*\\|.*\\|\\n`, 'i');
  content = content.replace(regex, '');

  writeFileSync(STATE_FILE, content);
  printSuccess(`Resolved blocker in STATE.md`);
  return 0;
}

function cmdSetPhase(phase: string): number {
  const validPhases = ['Planning', 'Executing', 'Validating', 'Cleanup', 'Complete', 'Blocked'];
  
  if (!phase || !validPhases.includes(phase)) {
    printError(`Usage: state-update.ts set-phase <phase>`);
    console.log(`Valid phases: ${validPhases.join(', ')}`);
    return 1;
  }

  if (!existsSync(STATE_FILE)) {
    printError('STATE.md not found. Run spec-setup.ts first.');
    return 1;
  }

  let content = readFileSync(STATE_FILE, 'utf-8');
  const timestamp = getTimestamp();

  content = content.replace(
    /\*\*Phase\*\*:.*?\|/,
    `**Phase**: ${phase} |`
  );

  content = content.replace(
    /\*\*Status\*\*:.*?\n/,
    `**Status**: ${phase}\n`
  );

  content = content.replace(
    /\*\*Last activity\*\*:.*?\n/,
    `**Last activity**: ${timestamp} — Phase changed to ${phase}\n`
  );

  writeFileSync(STATE_FILE, content);
  printSuccess(`Updated STATE.md: phase set to ${phase}`);
  return 0;
}

function cmdInit(): number {
  if (existsSync(STATE_FILE)) {
    printWarning('STATE.md already exists');
    return 0;
  }

  const { STATE_TEMPLATE, fillTemplate } = require('./lib/templates');
  const content = fillTemplate(STATE_TEMPLATE, {
    taskName: 'initialized',
    timestamp: getTimestamp(),
  });

  writeFileSync(STATE_FILE, content);
  printSuccess('Created STATE.md');
  return 0;
}

function printUsage(): void {
  console.log(`
STATE.md Updater - Manage project state

Usage:
  bun run state-update.ts <command> [args]

Commands:
  init                          Initialize STATE.md
  start-task <slug>             Mark task as started
  complete-task <slug> [dur]    Mark task as complete
  set-phase <phase>             Set current phase
  add-decision <slug> <dec>     Log a decision
  add-blocker <blocker> [imp]   Add a blocker
  resolve-blocker <blocker>     Resolve a blocker

Phases:
  Planning, Executing, Validating, Cleanup, Complete, Blocked

Examples:
  bun run state-update.ts start-task add-auth
  bun run state-update.ts complete-task add-auth 45
  bun run state-update.ts add-decision add-auth "Use JWT tokens" High
`);
}

// =============================================================================
// MAIN
// =============================================================================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  printUsage();
  process.exit(0);
}

const command = args[0];
const cmdArgs = args.slice(1);

switch (command) {
  case 'init':
    process.exit(cmdInit());
  case 'start-task':
    process.exit(cmdStartTask(cmdArgs[0]));
  case 'complete-task':
    process.exit(cmdCompleteTask(cmdArgs[0], cmdArgs[1]));
  case 'set-phase':
    process.exit(cmdSetPhase(cmdArgs[0]));
  case 'add-decision':
    process.exit(cmdAddDecision(cmdArgs[0], cmdArgs[1], cmdArgs[2]));
  case 'add-blocker':
    process.exit(cmdAddBlocker(cmdArgs[0], cmdArgs[1], cmdArgs[2]));
  case 'resolve-blocker':
    process.exit(cmdResolveBlocker(cmdArgs[0]));
  default:
    printError(`Unknown command: ${command}`);
    printUsage();
    process.exit(1);
}
