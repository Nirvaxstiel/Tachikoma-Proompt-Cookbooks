#!/usr/bin/env bun
/**
 * Spec Session Setup
 * Creates .opencode/agents/tachikoma/spec/{task-slug}/ structure for the session
 * 
 * Converted from spec-setup.sh
 */

import { parseArgs } from 'node:util';
import { existsSync, mkdirSync, writeFileSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
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
} from './lib/templates';
import { colors, printHeader, printSuccess, printWarning } from './lib/colors';

// =============================================================================
// PATHS
// =============================================================================

// CLI is at .opencode/cli/, so we go up 1 level to get .opencode/
const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, '..');
const TACHIKOMA_DIR = join(OPENCODE_DIR, 'agents', 'tachikoma');
const SPEC_DIR = join(TACHIKOMA_DIR, 'spec');
const STATE_FILE = join(OPENCODE_DIR, 'STATE.md');

// =============================================================================
// MAIN
// =============================================================================

function createSpecFolder(taskName: string): number {
  if (!taskName) {
    console.error('Usage: bun run spec-setup.ts "<task-name>"');
    return 1;
  }

  const slug = generateSlug(taskName);
  const sessionDir = join(SPEC_DIR, slug);
  const reportsDir = join(sessionDir, 'reports');

  printHeader('Spec Session Created');
  console.log();

  // Check if already exists
  if (existsSync(sessionDir)) {
    printWarning(`Spec folder already exists: ${sessionDir}`);
    console.log('Will update files...\n');
  }

  // Create directories
  mkdirSync(sessionDir, { recursive: true });
  mkdirSync(reportsDir, { recursive: true });

  // Template values
  const values = {
    taskName,
    slug,
    timestamp: getTimestamp(),
  };

  // Create files
  const files: [string, string][] = [
    ['todo.md', fillTemplate(TODO_TEMPLATE, values)],
    ['SPEC.md', fillTemplate(SPEC_TEMPLATE, values)],
    ['design.md', fillTemplate(DESIGN_TEMPLATE, values)],
    ['tasks.md', fillTemplate(TASKS_TEMPLATE, values)],
    ['boundaries.md', fillTemplate(BOUNDARIES_TEMPLATE, values)],
  ];

  for (const [filename, content] of files) {
    writeFileSync(join(sessionDir, filename), content);
  }

  // Output info
  console.log(`Task: ${colors.green}${taskName}${colors.reset}`);
  console.log(`Slug: ${colors.green}${slug}${colors.reset}`);
  console.log(`Folder: ${colors.green}${sessionDir}${colors.reset}`);
  console.log();
  console.log('Files created:');
  for (const [filename] of files) {
    const extra = filename === 'SPEC.md' ? ' (with BDD acceptance criteria)' : '';
    const extra2 = filename === 'boundaries.md' ? ' (protected files/patterns)' : '';
    console.log(`  ${colors.green}├── ${filename}${colors.reset}${extra}${extra2}`);
  }
  console.log(`  ${colors.green}└── reports/${colors.reset}`);
  console.log();

  // Initialize or update STATE.md
  if (!existsSync(STATE_FILE)) {
    writeFileSync(STATE_FILE, fillTemplate(STATE_TEMPLATE, values));
    console.log(`${colors.green}[+]${colors.reset} Created STATE.md`);
  } else {
    updateStateMd(slug, taskName);
    printSuccess('STATE.md already exists, will update');
  }

  console.log();
  printWarning(`Remember: Save artifacts to .opencode/agents/tachikoma/spec/${slug}/reports/`);
  printWarning('Update .opencode/STATE.md when task starts/completes');
  console.log();

  return 0;
}

function updateStateMd(slug: string, taskName: string): void {
  if (!existsSync(STATE_FILE)) return;

  let content = readFileSync(STATE_FILE, 'utf-8');
  const timestamp = getTimestamp();

  // Update current position
  content = content.replace(
    /\*\*Task\*\*:.*?\|.*?\*\*Phase\*\*:.*?\|.*?\*\*Status\*\*:.*?\n/,
    `**Task**: ${slug} | **Phase**: Planning | **Status**: Planning\n`
  );

  // Update last activity
  content = content.replace(
    /\*\*Last activity\*\*:.*?\n/,
    `**Last activity**: ${timestamp} — Task "${taskName}" initialized\n`
  );

  // Update session continuity
  content = content.replace(
    /\*\*Last session\*\*:.*?\n/,
    `**Last session**: ${timestamp}\n`
  );
  content = content.replace(
    /\*\*Next action\*\*:.*?\n/,
    `**Next action**: Fill in SPEC.md requirements and approach\n`
  );
  content = content.replace(
    /\*\*Resume context\*\*:.*?\n/,
    `**Resume context**: New task "${slug}" initialized, ready for planning\n`
  );

  writeFileSync(STATE_FILE, content);
}

// =============================================================================
// CLI
// =============================================================================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
Spec Session Setup - Create task spec folder

Usage:
  bun run spec-setup.ts "<task-name>"

Arguments:
  task-name    Name of the task (will be converted to slug)

Examples:
  bun run spec-setup.ts "fix auth bug"
  bun run spec-setup.ts "Add OAuth login to app"

Creates:
  .opencode/agents/tachikoma/spec/{slug}/
  ├── todo.md        Progress tracking
  ├── SPEC.md        Requirements + BDD AC
  ├── design.md      Architecture/plan
  ├── tasks.md       Task breakdown
  ├── boundaries.md  Protected files
  └── reports/       Generated artifacts
`);
  process.exit(0);
}

const taskName = args.join(' ');
process.exit(createSpecFolder(taskName));
