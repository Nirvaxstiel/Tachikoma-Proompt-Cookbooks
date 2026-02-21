#!/usr/bin/env bun
/**
 * UNIFY Phase Helper
 * Mandatory closure for tasks - reconciles plan vs. actual
 * 
 * Converted from unify-phase.sh
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, basename } from 'node:path';
import { SUMMARY_TEMPLATE, fillTemplate, getTimestamp, getIsoTimestamp } from './lib/templates';
import { colors, printHeader, printSuccess, printError, printWarning } from './lib/colors';

// =============================================================================
// PATHS
// =============================================================================

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, '..');
const TACHIKOMA_DIR = join(OPENCODE_DIR, 'agents', 'tachikoma');
const STATE_FILE = join(OPENCODE_DIR, 'STATE.md');
const SPEC_DIR = join(TACHIKOMA_DIR, 'spec');
const SUMMARY_TEMPLATE_FILE = join(TACHIKOMA_DIR, 'templates', 'SUMMARY.md');

// =============================================================================
// UNIFY PHASE
// =============================================================================

interface UnifyInput {
  slug: string;
  duration: string;
}

interface SpecFiles {
  spec: string | null;
  design: string | null;
  tasks: string | null;
  todo: string | null;
}

function readSpecFiles(slug: string): SpecFiles {
  const taskDir = join(SPEC_DIR, slug);

  const readFile = (filename: string): string | null => {
    const path = join(taskDir, filename);
    return existsSync(path) ? readFileSync(path, 'utf-8') : null;
  };

  return {
    spec: readFile('SPEC.md'),
    design: readFile('design.md'),
    tasks: readFile('tasks.md'),
    todo: readFile('todo.md'),
  };
}

function extractAcceptanceCriteria(specContent: string | null): string[] {
  if (!specContent) return [];

  const acRegex = /###?\s*AC-\d+:\s*(.+)/g;
  const criteria: string[] = [];
  let match;

  while ((match = acRegex.exec(specContent)) !== null) {
    criteria.push(match[1].trim());
  }

  return criteria;
}

function extractTasksProgress(tasksContent: string | null): { completed: number; total: number } {
  if (!tasksContent) return { completed: 0, total: 0 };

  const total = (tasksContent.match(/- \[[ x]\]/gi) || []).length;
  const completed = (tasksContent.match(/- \[x\]/gi) || []).length;

  return { completed, total };
}

function extractDecisionsFromState(): string[] {
  if (!existsSync(STATE_FILE)) return [];

  const content = readFileSync(STATE_FILE, 'utf-8');
  const decisions: string[] = [];
  const decisionRegex = /^\| (.+?) \| (.+?) \| (.+?) \|/gm;
  let match;

  while ((match = decisionRegex.exec(content)) !== null) {
    if (match[1] !== 'Decision' && !match[1].includes('*No')) {
      decisions.push(match[1]);
    }
  }

  return decisions;
}

function runUnify(input: UnifyInput): number {
  const { slug, duration } = input;

  if (!slug) {
    printError('Usage: bun run unify.ts <task-slug> [duration]');
    return 1;
  }

  const taskDir = join(SPEC_DIR, slug);
  
  if (!existsSync(taskDir)) {
    printError(`Spec folder not found: ${taskDir}`);
    return 1;
  }

  printHeader(`UNIFY Phase - Task: ${slug}`);
  console.log();

  // Read spec files
  const specFiles = readSpecFiles(slug);

  // Step 1: Compare Planned vs Actual
  printWarning('[1/5] Comparing Planned vs. Actual...');
  
  const plannedWording = specFiles.design 
    ? 'Design document found'
    : 'No design.md - plan was informal';
  
  console.log(`  Planned: ${plannedWording}`);
  console.log(`  Actual: See git status and changes.md for details`);
  console.log();

  // Step 2: Verify Acceptance Criteria
  printWarning('[2/5] Verifying Acceptance Criteria...');
  
  const criteria = extractAcceptanceCriteria(specFiles.spec);
  const acResults: string[] = [];

  if (criteria.length === 0) {
    console.log('  No formal acceptance criteria found');
    acResults.push('| AC-1 | N/A | No formal criteria |');
  } else {
    for (let i = 0; i < criteria.length; i++) {
      console.log(`  AC-${i + 1}: ${criteria[i]}`);
      console.log(`    Status: ${colors.yellow}MANUAL VERIFICATION REQUIRED${colors.reset}`);
      acResults.push(`| AC-${i + 1} | ${colors.yellow}Review${colors.reset} | ${criteria[i]} |`);
    }
  }
  console.log();

  // Step 3: Gather metrics
  printWarning('[3/5] Gathering metrics...');
  
  const { completed, total } = extractTasksProgress(specFiles.tasks);
  const decisions = extractDecisionsFromState();
  const dur = parseInt(duration) || 0;

  console.log(`  Tasks completed: ${completed}/${total}`);
  console.log(`  Duration: ${dur} minutes`);
  console.log(`  Decisions logged: ${decisions.length}`);
  console.log();

  // Step 4: Create SUMMARY.md
  printWarning('[4/5] Creating SUMMARY.md...');

  const values = {
    taskName: slug,
    completedTimestamp: getTimestamp(),
    startedTimestamp: 'See todo.md',
    duration: dur.toString(),
    status: 'Complete',
    tasksCompleted: `${completed}/${total}`,
    filesModified: 'See git diff',
    acResults: acResults.join('\n'),
    accomplishments: '- Task completed (see details in spec folder)',
    decisions: decisions.length > 0 
      ? decisions.map(d => `| ${d} | - | - |`).join('\n')
      : '| *No decisions logged* | - | - |',
    deviations: '| *None recorded* | - | - |',
    deferred: '| *None* | - | - |',
    filesTable: '| See spec folder | - | - |',
    nextSteps: '- [ ] Review and verify acceptance criteria\n- [ ] Update STATE.md with completion',
    technicalNotes: 'See design.md and tasks.md for details',
  };

  const summaryContent = fillTemplate(SUMMARY_TEMPLATE, values);
  const summaryPath = join(taskDir, 'SUMMARY.md');
  writeFileSync(summaryPath, summaryContent);

  printSuccess(`Created: ${summaryPath}`);
  console.log();

  // Step 5: Update STATE.md
  printWarning('[5/5] Updating STATE.md...');

  if (existsSync(STATE_FILE)) {
    let stateContent = readFileSync(STATE_FILE, 'utf-8');
    const timestamp = getTimestamp();

    // Update position
    stateContent = stateContent.replace(
      /\*\*Task\*\*:.*?\|.*?\*\*Phase\*\*:.*?\|.*?\*\*Status\*\*:.*?\n/,
      `**Task**: ${slug} | **Phase**: Complete | **Status**: Complete\n`
    );

    stateContent = stateContent.replace(
      /\*\*Last activity\*\*:.*?\n/,
      `**Last activity**: ${timestamp} — Task completed (${dur} min)\n`
    );

    // Update velocity
    const totalMatch = stateContent.match(/\*\*Total tasks completed\*\*:\s*(\d+)/);
    if (totalMatch) {
      const newTotal = parseInt(totalMatch[1]) + 1;
      stateContent = stateContent.replace(
        /\*\*Total tasks completed\*\*:\s*\d+/,
        `**Total tasks completed**: ${newTotal}`
      );
    }

    // Update session continuity
    stateContent = stateContent.replace(
      /\*\*Last session\*\*:.*?\n/,
      `**Last session**: ${timestamp}\n`
    );
    stateContent = stateContent.replace(
      /\*\*Stopped at\*\*:.*?\n/,
      `**Stopped at**: Task ${slug} completed\n`
    );
    stateContent = stateContent.replace(
      /\*\*Next action\*\*:.*?\n/,
      `**Next action**: Review SUMMARY.md or start new task\n`
    );

    writeFileSync(STATE_FILE, stateContent);
    printSuccess('Updated STATE.md');
  }

  console.log();

  // Update todo.md
  if (specFiles.todo) {
    let todoContent = specFiles.todo;
    todoContent = todoContent.replace(
      /\*\*Status\*\*:.*?\n/,
      `**Status**: COMPLETE\n`
    );
    writeFileSync(join(taskDir, 'todo.md'), todoContent + `\n**Completed**: ${getTimestamp()}\n`);
    printSuccess('Updated todo.md');
  }

  console.log();

  // Final summary
  printHeader('UNIFY Phase Complete');
  console.log();
  console.log(`Task: ${slug}`);
  console.log(`Status: ${colors.green}Complete${colors.reset}`);
  console.log(`Duration: ${dur} minutes`);
  console.log();
  console.log('Files created/updated:');
  console.log(`  ├── SUMMARY.md`);
  console.log(`  ├── STATE.md`);
  console.log(`  └── todo.md`);
  console.log();
  console.log(`Review SUMMARY.md: .opencode/agents/tachikoma/spec/${slug}/SUMMARY.md`);
  console.log(`Review STATE.md: .opencode/STATE.md`);
  console.log();

  // UNIFY checklist
  printHeader('UNIFY Checklist');
  console.log();
  console.log(`[ ] Compared planned vs. actual`);
  console.log(`[ ] Verified acceptance criteria`);
  console.log(`[x] Created SUMMARY.md`);
  console.log(`[x] Updated STATE.md`);
  console.log(`[x] Updated todo.md`);
  console.log();

  return 0;
}

// =============================================================================
// CLI
// =============================================================================

const args = process.argv.slice(2);

if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
  console.log(`
UNIFY Phase Helper - Mandatory task closure

Usage:
  bun run unify.ts <task-slug> [duration]

Arguments:
  task-slug    The task identifier (from spec-setup.ts)
  duration     How long the task took (in minutes)

Examples:
  bun run unify.ts add-auth 45
  bun run unify.ts fix-bug 10

This script:
  1. Compares planned vs. actual
  2. Verifies acceptance criteria
  3. Creates SUMMARY.md
  4. Updates STATE.md
  5. Updates todo.md
`);
  process.exit(0);
}

const slug = args[0];
const duration = args[1] || '0';

process.exit(runUnify({ slug, duration }));
