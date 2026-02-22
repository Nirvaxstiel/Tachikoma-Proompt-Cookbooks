#!/usr/bin/env bun
/**
 * Workflow State CLI
 *
 * Track workflow state and transitions from command line.
 *
 * Usage:
 *   bun run .opencode/cli/workflow.ts create "query" "intent" 0.85
 *   bun run .opencode/cli/workflow.ts checkpoint initial "intent" 0.85
 *   bun run .opencode/cli/workflow.ts checkpoint milestone "intent" 0.85
 *   bun run .opencode/cli/workflow.ts checkpoint final
 *   bun run .opencode/cli/workflow.ts detect "actually i want to implement"
 *   bun run .opencode/cli/workflow.ts state
 */

import {
  WorkflowManager,
  CheckpointSystem,
  ContextSwitchDetector,
} from "./workflow-state";

const CLI_DIR = import.meta.dir;
const STATE_FILE = `${CLI_DIR}/workflow-state.json`;

// Simple file-based persistence
function loadState(): WorkflowManager | null {
  try {
    const content = Bun.file(STATE_FILE).text();
    const data = JSON.parse(content);
    // Recreate manager from state
    const manager = new WorkflowManager();
    return manager;
  } catch {
    return null;
  }
}

function saveState(manager: WorkflowManager): void {
  // For now, just log - full persistence would require serializing the manager
  Bun.write(STATE_FILE, JSON.stringify({ saved: new Date().toISOString() }));
}

async function cmdCreate(
  query: string,
  intent: string,
  confidenceStr: string,
): Promise<number> {
  const confidence = parseFloat(confidenceStr);
  const manager = new WorkflowManager();

  const workflowId = manager.createWorkflow(query, intent, confidence);

  console.log(`Created workflow: ${workflowId}`);
  console.log(`  Intent: ${intent}`);
  console.log(`  Confidence: ${confidence}`);
  console.log(`  Query: ${query}`);

  saveState(manager);
  return 0;
}

async function cmdCheckpoint(
  type: string,
  intent?: string,
  confidenceStr?: string,
): Promise<number> {
  const manager = new WorkflowManager();
  const workflow = manager.getCurrentWorkflow();

  if (!workflow) {
    console.error(
      'No active workflow. Create one first with "workflow create"',
    );
    return 1;
  }

  const checkpoint = new CheckpointSystem(workflow);
  const confidence = confidenceStr
    ? parseFloat(confidenceStr)
    : workflow.getState().confidence;
  const intentArg = intent || workflow.getState().intent;

  let checkpointId: string;

  switch (type) {
    case "initial":
      checkpointId = checkpoint.createInitial(intentArg, confidence);
      console.log(`Created initial checkpoint: ${checkpointId}`);
      break;
    case "milestone":
      checkpointId = checkpoint.createMilestone(intentArg, confidence);
      console.log(`Created milestone checkpoint: ${checkpointId}`);
      break;
    case "final":
      checkpointId = checkpoint.createFinal();
      console.log(`Created final checkpoint: ${checkpointId}`);
      break;
    default:
      console.error(`Unknown checkpoint type: ${type}`);
      console.error("Valid types: initial, milestone, final");
      return 1;
  }

  const state = workflow.getState();
  console.log(`  Current state: ${state.state}`);
  console.log(`  Intent: ${state.intent}`);
  console.log(`  Checkpoints: ${state.checkpoints.length}`);

  return 0;
}

async function cmdDetect(message: string): Promise<number> {
  const detected = ContextSwitchDetector.detect(message);

  if (detected) {
    console.log("Context switch detected: YES");
    const extracted = ContextSwitchDetector.extractIntent(message);
    console.log(`  Extracted intent: ${extracted}`);
  } else {
    console.log("Context switch detected: NO");
  }

  return 0;
}

async function cmdState(): Promise<number> {
  const manager = new WorkflowManager();
  const workflow = manager.getCurrentWorkflow();

  if (!workflow) {
    console.log("No active workflow");
    return 0;
  }

  const state = workflow.getState();

  console.log("Current Workflow:");
  console.log(`  ID: ${state.id}`);
  console.log(`  State: ${state.state}`);
  console.log(`  Intent: ${state.intent}`);
  console.log(`  Confidence: ${state.confidence}`);
  console.log(`  Query: ${state.query}`);
  console.log(`  Checkpoints: ${state.checkpoints.length}`);

  if (state.intentHistory.length > 0) {
    console.log("  Intent History:");
    for (const entry of state.intentHistory) {
      console.log(
        `    - ${entry.intent} (${entry.confidence}) - ${entry.trigger}`,
      );
    }
  }

  return 0;
}

async function cmdTransition(newState: string): Promise<number> {
  const manager = new WorkflowManager();
  const workflow = manager.getCurrentWorkflow();

  if (!workflow) {
    console.error("No active workflow");
    return 1;
  }

  try {
    workflow.transition(newState as any);
    console.log(`Transitioned to: ${newState}`);
    console.log(`Current state: ${workflow.getCurrentState()}`);
    return 0;
  } catch (err) {
    console.error(`Error: ${(err as Error).message}`);
    return 1;
  }
}

function printUsage(): void {
  console.log(`
Workflow State CLI - Track workflow state and transitions

Usage:
  bun run .opencode/cli/workflow.ts <command> [options]

Commands:
  create <query> <intent> <confidence>    Create new workflow
  checkpoint <type> [intent] [conf]     Create checkpoint (initial|milestone|final)
  detect <message>                      Detect context switch in message
  state                                  Show current workflow state
  transition <state>                     Transition to new state

States:
  INIT, CLASSIFY, PLAN, EXECUTE, PAUSED, DONE

Examples:
  bun run .opencode/cli/workflow.ts create "fix auth bug" "debug" 0.85
  bun run .opencode/cli/workflow.ts checkpoint initial "debug" 0.85
  bun run .opencode/cli/workflow.ts detect "actually I want to implement oauth"
  bun run .opencode/cli/workflow.ts state
  bun run .opencode/cli/workflow.ts transition PLAN
`);
}

async function main(): Promise<number> {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    return 0;
  }

  const command = args[0];
  const restArgs = args.slice(1);

  switch (command) {
    case "create":
      if (restArgs.length < 3) {
        console.error("Usage: create <query> <intent> <confidence>");
        return 1;
      }
      return await cmdCreate(restArgs[0], restArgs[1], restArgs[2]);

    case "checkpoint":
      if (restArgs.length < 1) {
        console.error("Usage: checkpoint <type> [intent] [confidence]");
        return 1;
      }
      return await cmdCheckpoint(restArgs[0], restArgs[1], restArgs[2]);

    case "detect":
      if (restArgs.length < 1) {
        console.error("Usage: detect <message>");
        return 1;
      }
      return await cmdDetect(restArgs.join(" "));

    case "state":
      return await cmdState();

    case "transition":
      if (restArgs.length < 1) {
        console.error("Usage: transition <state>");
        return 1;
      }
      return await cmdTransition(restArgs[0]);

    case "help":
    case "--help":
    case "-h":
      printUsage();
      return 0;

    default:
      console.error(`Unknown command: ${command}`);
      printUsage();
      return 1;
  }
}

main().then((code) => process.exit(code));
