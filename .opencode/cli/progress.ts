#!/usr/bin/env bun
/**
 * Tachikoma Progress
 * Show current progress with ONE next action
 * 
 * Converted from tachi-progress.sh
 */

import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { colors, printHeader, printSuccess, printWarning } from './lib/colors';

// =============================================================================
// PATHS
// =============================================================================

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, '..');
const TACHIKOMA_DIR = join(OPENCODE_DIR, 'agents', 'tachikoma');
const STATE_FILE = join(OPENCODE_DIR, 'STATE.md');
const SPEC_DIR = join(TACHIKOMA_DIR, 'spec');

// =============================================================================
// PROGRESS DISPLAY
// =============================================================================

interface StateInfo {
  task: string;
  phase: string;
  status: string;
  lastActivity: string;
  nextAction: string;
  blockers: string[];
  decisions: string[];
}

function parseState(): StateInfo | null {
  if (!existsSync(STATE_FILE)) {
    return null;
  }

  const content = readFileSync(STATE_FILE, 'utf-8');

  const taskMatch = content.match(/\*\*Task\*\*:\s*(\S+)/);
  const phaseMatch = content.match(/\*\*Phase\*\*:\s*(\S+)/);
  const statusMatch = content.match(/\*\*Status\*\*:\s*(\S+)/);
  const lastActivityMatch = content.match(/\*\*Last activity\*\*:\s*(.+)/);
  const nextActionMatch = content.match(/\*\*Next action\*\*:\s*(.+)/);

  // Extract blockers
  const blockers: string[] = [];
  const blockerSection = content.match(/### Blockers\/Concerns[\s\S]*?\n---/);
  if (blockerSection) {
    const blockerRegex = /^\| (.+?) \|/gm;
    let match;
    while ((match = blockerRegex.exec(blockerSection[0])) !== null) {
      if (match[1] !== 'Blocker' && !match[1].includes('*No')) {
        blockers.push(match[1]);
      }
    }
  }

  // Extract recent decisions
  const decisions: string[] = [];
  const decisionSection = content.match(/### Decisions[\s\S]*?\n---/);
  if (decisionSection) {
    const decisionRegex = /^\| (.+?) \|/gm;
    let match;
    let count = 0;
    while ((match = decisionRegex.exec(decisionSection[0])) !== null && count < 3) {
      if (match[1] !== 'Decision' && !match[1].includes('*No')) {
        decisions.push(match[1]);
        count++;
      }
    }
  }

  return {
    task: taskMatch ? taskMatch[1] : 'none',
    phase: phaseMatch ? phaseMatch[1] : 'unknown',
    status: statusMatch ? statusMatch[1] : 'unknown',
    lastActivity: lastActivityMatch ? lastActivityMatch[1] : '',
    nextAction: nextActionMatch ? nextActionMatch[1] : 'Review STATE.md',
    blockers,
    decisions,
  };
}

function getTaskProgress(slug: string): { total: number; completed: number } | null {
  const tasksFile = join(SPEC_DIR, slug, 'tasks.md');
  if (!existsSync(tasksFile)) {
    return null;
  }

  const content = readFileSync(tasksFile, 'utf-8');
  const total = (content.match(/- \[[ x]\]/gi) || []).length;
  const completed = (content.match(/- \[x\]/gi) || []).length;

  return { total, completed };
}

function suggestNextAction(state: StateInfo): string {
  // Based on status
  switch (state.status.toLowerCase()) {
    case 'planning':
      return 'Continue with SPEC.md or design.md';
    case 'executing':
      return `Continue tasks in ${state.task}/tasks.md`;
    case 'validating':
      return 'Run verification steps from tasks.md';
    case 'blocked':
      return `Address blocker: ${state.blockers[0] || 'see STATE.md'}`;
    case 'complete':
      return 'Start new task or review SUMMARY.md';
    default:
      return state.nextAction;
  }
}

function showProgress(verbose: boolean): number {
  const state = parseState();

  if (!state) {
    printWarning('STATE.md not found. No current progress to show.');
    console.log();
    console.log('To get started:');
    console.log('  bun run .opencode/cli/spec-setup.ts "my task"');
    return 0;
  }

  printHeader('Tachikoma Progress');
  console.log();

  // Current position
  console.log(`${colors.yellow}Current Position${colors.reset}`);
  console.log(`Task: ${colors.green}${state.task}${colors.reset}`);
  console.log(`Phase: ${colors.green}${state.phase}${colors.reset}`);
  console.log(`Status: ${colors.green}${state.status}${colors.reset}`);
  console.log();
  console.log(`Last Activity: ${state.lastActivity}`);
  console.log();

  // Task progress if available
  const progress = getTaskProgress(state.task);
  if (progress && progress.total > 0) {
    const pct = Math.round((progress.completed / progress.total) * 100);
    const bar = '█'.repeat(Math.floor(pct / 10)) + '░'.repeat(10 - Math.floor(pct / 10));
    console.log(`Task Progress: [${bar}] ${pct}% (${progress.completed}/${progress.total})`);
    console.log();
  }

  // Blockers
  if (state.blockers.length > 0) {
    console.log(`${colors.red}Active Blockers:${colors.reset}`);
    for (const blocker of state.blockers) {
      console.log(`  - ${blocker}`);
    }
    console.log();
  }

  // Recent decisions
  if (state.decisions.length > 0 && verbose) {
    console.log(`${colors.cyan}Recent Decisions:${colors.reset}`);
    for (const decision of state.decisions) {
      console.log(`  - ${decision}`);
    }
    console.log();
  }

  // Recommended next action
  printHeader('Recommended Next Action');
  console.log();
  const nextAction = suggestNextAction(state);
  console.log(colors.green + nextAction + colors.reset);
  console.log();

  // Related commands
  console.log(`${colors.yellow}Related Commands:${colors.reset}`);
  console.log('  bun run .opencode/cli/router.ts help    Show all commands');
  console.log('  bun run .opencode/cli/spec-setup.ts     Create new task');
  console.log('  bun run .opencode/cli/handoff.ts pause  Save progress for later');
  console.log();

  return 0;
}

// =============================================================================
// CLI
// =============================================================================

const args = process.argv.slice(2);
const verbose = args.includes('--verbose') || args.includes('-v');

showProgress(verbose);
