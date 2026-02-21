#!/usr/bin/env bun
/**
 * Tachikoma Help
 * Show all available commands
 * 
 * Converted from tachi-help.sh
 */

import { colors, printHeader } from './lib/colors';

function showHelp(): void {
  printHeader('Tachikoma Commands');
  console.log();

  console.log(`${colors.green}Core Workflow${colors.reset}`);
  console.log(`  ${colors.yellow}spec-setup <task-name>${colors.reset}            Create task spec (STATE.md initialized)`);
  console.log(`  ${colors.yellow}state-update <command> [args]${colors.reset}       Manage project state (8 commands)`);
  console.log(`  ${colors.yellow}unify <task-slug> <duration>${colors.reset}   Mandatory loop closure (UNIFY)`);
  console.log(`  ${colors.yellow}handoff pause [--reason <reason>]${colors.reset}   Create handoff for break`);
  console.log(`  ${colors.yellow}handoff resume [handoff-file]${colors.reset}        Resume from handoff (next action)`);
  console.log();

  console.log(`${colors.green}Helper Commands${colors.reset}`);
  console.log(`  ${colors.yellow}progress${colors.reset}                         Show progress with ONE next action`);
  console.log(`  ${colors.yellow}router full <query> --json${colors.reset}         Classify intent and get route`);
  console.log();

  printHeader('');
  console.log();

  console.log(`${colors.yellow}For detailed usage, see:${colors.reset}`);
  console.log(`  bun run .opencode/cli/router.ts --help`);
  console.log(`  bun run .opencode/cli/state-update.ts --help`);
  console.log(`  bun run .opencode/cli/handoff.ts --help`);
  console.log();

  console.log(`${colors.green}Slash Commands (in opencode)${colors.reset}`);
  console.log(`  /tachikoma-help      Show command reference`);
  console.log(`  /tachikoma-progress  Show progress with ONE next action`);
  console.log(`  /tachikoma-unify     Run UNIFY phase`);
  console.log(`  /tachikoma-pause     Create handoff`);
  console.log(`  /tachikoma-resume    Resume from handoff`);
  console.log();

  printHeader('');
}

showHelp();
