// Workflow State Machine Implementation
// Type: TypeScript
// Purpose: Track workflow state and support transitions

// =============================================================================
// TYPES
// =============================================================================

export type WorkflowState = 'INIT' | 'CLASSIFY' | 'PLAN' | 'EXECUTE' | 'PAUSED' | 'DONE';

export interface Checkpoint {
  id: string;
  type: 'initial' | 'milestone' | 'context-switch' | 'final';
  timestamp: Date;
  intent: string;
  confidence: number;
  decision: string;
}

export interface IntentEntry {
  timestamp: Date;
  intent: string;
  confidence: number;
  trigger: string;
  decision: string;
}

export interface Workflow {
  id: string;
  query: string;
  state: WorkflowState;
  intent: string;
  confidence: number;
  checkpoints: Checkpoint[];
  intentHistory: IntentEntry[];
  parent?: string;
  children: string[];
  priority: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface Constraints {
  hard: string[];
  soft: string[];
  optional: string[];
  applied: {
    hard: string[];
    soft: string[];
    optional: string[];
  };
}

// =============================================================================
// WORKFLOW STATE MACHINE
// =============================================================================

export class WorkflowStateMachine {
  private workflow: Workflow;
  private constraints: Constraints;

  constructor(query: string, initialIntent: string, confidence: number) {
    this.workflow = {
      id: this.generateId(),
      query,
      state: 'INIT',
      intent: initialIntent,
      confidence,
      checkpoints: [],
      intentHistory: [],
      children: [],
      priority: 0.5,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.constraints = {
      hard: ['intent_classification', 'core_contract_load', 'state_tracking'],
      soft: ['spec_folder', 'unify_phase', 'full_design'],
      optional: ['research_phase', 'validation_phase', 'documentation'],
      applied: {
        hard: [],
        soft: [],
        optional: []
      }
    };
  }

  // Generate unique workflow ID
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substr(2, 5);
    return `W${timestamp}${random}`;
  }

  // Get current workflow state
  getState(): Workflow {
    return { ...this.workflow };
  }

  // Get current state
  getCurrentState(): WorkflowState {
    return this.workflow.state;
  }

  // Transition to new state
  transition(newState: WorkflowState): void {
    const validTransitions: Record<WorkflowState, WorkflowState[]> = {
      'INIT': ['CLASSIFY'],
      'CLASSIFY': ['PLAN'],
      'PLAN': ['EXECUTE', 'PAUSED'],
      'EXECUTE': ['DONE', 'PAUSED', 'PLAN'],
      'PAUSED': ['CLASSIFY', 'PLAN', 'EXECUTE'],
      'DONE': ['INIT']
    };

    const allowed = validTransitions[this.workflow.state];
    if (!allowed.includes(newState)) {
      throw new Error(`Invalid transition from ${this.workflow.state} to ${newState}`);
    }

    this.workflow.state = newState;
    this.workflow.updatedAt = new Date();
  }

  // Create checkpoint
  createCheckpoint(
    type: Checkpoint['type'],
    intent: string,
    confidence: number,
    decision: string
  ): string {
    const checkpoint: Checkpoint = {
      id: this.generateCheckpointId(),
      type,
      timestamp: new Date(),
      intent,
      confidence,
      decision
    };

    this.workflow.checkpoints.push(checkpoint);
    this.workflow.intent = intent;
    this.workflow.confidence = confidence;
    this.workflow.updatedAt = new Date();

    // Add to intent history
    this.addIntentHistory(intent, confidence, type, decision);

    return checkpoint.id;
  }

  // Generate checkpoint ID
  private generateCheckpointId(): string {
    const count = this.workflow.checkpoints.length + 1;
    return `CP${count.toString().padStart(3, '0')}`;
  }

  // Add intent history entry
  addIntentHistory(intent: string, confidence: number, trigger: string, decision: string): void {
    const entry: IntentEntry = {
      timestamp: new Date(),
      intent,
      confidence,
      trigger,
      decision
    };

    this.workflow.intentHistory.push(entry);
    this.workflow.updatedAt = new Date();
  }

  // Calculate intent change
  calculateIntentChange(newIntent: string, newConfidence: number): number {
    // Simple algorithm: measure difference in intent and confidence
    const intentDiff = this.workflow.intent !== newIntent ? 0.5 : 0;
    const confidenceDiff = Math.abs(this.workflow.confidence - newConfidence);

    return (intentDiff + confidenceDiff) / 2;
  }

  // Check if should re-classify
  shouldReclassify(newIntent: string, newConfidence: number): boolean {
    const change = this.calculateIntentChange(newIntent, newConfidence);
    return change > 0.3; // Threshold for re-classification
  }

  // Apply constraints
  applyConstraints(complexity: number): void {
    // Always apply hard constraints
    this.constraints.applied.hard = [...this.constraints.hard];

    // Apply soft constraints based on complexity
    if (complexity >= 0.5) {
      this.constraints.applied.soft = [...this.constraints.soft];
    } else {
      this.constraints.applied.soft = [];
    }

    // Apply optional constraints based on user need
    // (This would be determined by agent logic)
    this.constraints.applied.optional = [];
  }

  // Get applied constraints
  getConstraints(): Constraints {
    return { ...this.constraints };
  }

  // Add child workflow
  addChild(childId: string): void {
    if (!this.workflow.children.includes(childId)) {
      this.workflow.children.push(childId);
      this.workflow.updatedAt = new Date();
    }
  }

  // Set parent workflow
  setParent(parentId: string): void {
    this.workflow.parent = parentId;
    this.workflow.updatedAt = new Date();
  }

  // Pause workflow
  pause(): void {
    this.transition('PAUSED');
  }

  // Resume workflow
  resume(): void {
    if (this.workflow.state === 'PAUSED') {
      this.transition('EXECUTE');
    } else {
      throw new Error(`Cannot resume from ${this.workflow.state}`);
    }
  }

  // Complete workflow
  complete(): void {
    this.transition('DONE');
  }

  // Serialize to JSON
  toJSON(): string {
    return JSON.stringify({
      workflow: this.workflow,
      constraints: this.constraints
    }, null, 2);
  }

  // Deserialize from JSON
  static fromJSON(json: string): WorkflowStateMachine {
    const data = JSON.parse(json);
    const machine = new WorkflowStateMachine(data.workflow.query, data.workflow.intent, data.workflow.confidence);
    machine.workflow = data.workflow;
    machine.constraints = data.constraints;
    return machine;
  }
}

// =============================================================================
// CHECKPOINT SYSTEM
// =============================================================================

export class CheckpointSystem {
  private machine: WorkflowStateMachine;

  constructor(machine: WorkflowStateMachine) {
    this.machine = machine;
  }

  // Create initial checkpoint
  createInitial(intent: string, confidence: number): string {
    this.machine.transition('CLASSIFY');
    return this.machine.createCheckpoint('initial', intent, confidence, 'Start workflow');
  }

  // Create milestone checkpoint
  createMilestone(intent: string, confidence: number): string {
    const newIntent = intent || this.machine.getState().intent;
    const newConfidence = confidence || this.machine.getState().confidence;

    // Check if intent changed
    if (this.machine.shouldReclassify(newIntent, newConfidence)) {
      return this.machine.createCheckpoint('milestone', newIntent, newConfidence, 'Intent changed, re-classify');
    }

    return this.machine.createCheckpoint('milestone', newIntent, newConfidence, 'Continue');
  }

  // Create context switch checkpoint
  createContextSwitch(newIntent: string, newConfidence: number): string {
    this.machine.pause();
    const decision = this.shouldPivot(newIntent, newConfidence)
      ? 'Pivot to new intent'
      : 'Save and branch';
    return this.machine.createCheckpoint('context-switch', newIntent, newConfidence, decision);
  }

  // Create final checkpoint
  createFinal(): string {
    this.machine.transition('DONE');
    const state = this.machine.getState();
    return this.machine.createCheckpoint('final', state.intent, state.confidence, 'Complete workflow');
  }

  // Check if should pivot
  private shouldPivot(newIntent: string, newConfidence: number): boolean {
    const change = this.machine.calculateIntentChange(newIntent, newConfidence);
    return change > 0.5; // Higher threshold for pivot vs branch
  }
}

// =============================================================================
// CONTEXT SWITCH DETECTION
// =============================================================================

export const CONTEXT_SWITCH_PATTERNS = [
  /actually.*want/i,
  /wait.*clarify/i,
  /hold.*thought/i,
  /nevermind/i,
  /different.*approach/i,
  /forget.*that/i,
  /change.*mind/i,
  /instead.*of/i
];

export class ContextSwitchDetector {
  // Detect if user message indicates context switch
  static detect(message: string): boolean {
    return CONTEXT_SWITCH_PATTERNS.some(pattern => pattern.test(message));
  }

  // Extract new intent from message
  static extractIntent(message: string): string {
    // Simple extraction - in practice, would use router
    const patterns = [
      /actually.*want to (.*)/i,
      /wait.*clarify.*(.*)/i,
      /instead.*of.* (.*)/i,
      /change.*mind.* (.*)/i
    ];

    for (const pattern of patterns) {
      const match = message.match(pattern);
      if (match) {
        return match[1].trim();
      }
    }

    return message;
  }
}

// =============================================================================
// WORKFLOW MANAGER
// =============================================================================

export class WorkflowManager {
  private activeWorkflows: Map<string, WorkflowStateMachine> = new Map();
  private currentWorkflowId?: string;

  // Create new workflow
  createWorkflow(query: string, intent: string, confidence: number): string {
    const machine = new WorkflowStateMachine(query, intent, confidence);
    this.activeWorkflows.set(machine.getState().id, machine);
    this.currentWorkflowId = machine.getState().id;
    return machine.getState().id;
  }

  // Get current workflow
  getCurrentWorkflow(): WorkflowStateMachine | undefined {
    if (!this.currentWorkflowId) {
      return undefined;
    }
    return this.activeWorkflows.get(this.currentWorkflowId);
  }

  // Get workflow by ID
  getWorkflow(id: string): WorkflowStateMachine | undefined {
    return this.activeWorkflows.get(id);
  }

  // Switch workflow
  switchWorkflow(id: string): void {
    if (!this.activeWorkflows.has(id)) {
      throw new Error(`Workflow ${id} not found`);
    }
    this.currentWorkflowId = id;
  }

  // Handle context switch
  handleContextSwitch(message: string): { action: string; workflowId?: string } {
    if (!ContextSwitchDetector.detect(message)) {
      return { action: 'none' };
    }

    const current = this.getCurrentWorkflow();
    if (!current) {
      return { action: 'none' };
    }

    const newIntent = ContextSwitchDetector.extractIntent(message);

    // Create checkpoint system
    const checkpoint = new CheckpointSystem(current);

    // Re-classify would happen here via router
    const newConfidence = 0.8; // Placeholder

    // Create context switch checkpoint
    const checkpointId = checkpoint.createContextSwitch(newIntent, newConfidence);

    // Decide action
    if (checkpoint.shouldPivot(newIntent, newConfidence)) {
      current.resume();
      return { action: 'pivot', workflowId: current.getState().id };
    } else {
      // Create new workflow branch
      const newWorkflowId = this.createWorkflow(message, newIntent, newConfidence);
      current.addChild(newWorkflowId);
      this.activeWorkflows.get(newWorkflowId)!.setParent(current.getState().id);
      this.switchWorkflow(newWorkflowId);

      return { action: 'branch', workflowId: newWorkflowId };
    }
  }

  // Save all workflows to STATE.md
  async saveToState(): Promise<void> {
    // This would integrate with state-update.ts
    const workflows = Array.from(this.activeWorkflows.values()).map(m => m.getState());
    const json = JSON.stringify(workflows, null, 2);

    // Write to STATE.md (simplified)
    console.log('Workflows:', json);
  }
}

// =============================================================================
// EXAMPLE USAGE
// =============================================================================

async function exampleUsage() {
  const manager = new WorkflowManager();

  // Create initial workflow
  const workflowId = manager.createWorkflow(
    'Research authentication in my app',
    'research',
    0.85
  );

  console.log('Created workflow:', workflowId);

  // Get current workflow
  const workflow = manager.getCurrentWorkflow()!;
  const checkpoint = new CheckpointSystem(workflow);

  // Create initial checkpoint
  const cp1 = checkpoint.createInitial('research', 0.85);
  console.log('Initial checkpoint:', cp1);

  // Move to PLAN state
  workflow.transition('PLAN');
  console.log('Current state:', workflow.getCurrentState());

  // Create milestone checkpoint
  const cp2 = checkpoint.createMilestone('research', 0.82);
  console.log('Milestone checkpoint:', cp2);

  // User signals context switch
  const contextSwitchResult = manager.handleContextSwitch(
    'Actually, I want to implement OAuth instead'
  );
  console.log('Context switch result:', contextSwitchResult);

  // Save to STATE.md
  await manager.saveToState();
}

// Run example if executed directly
if (import.meta.main) {
  exampleUsage();
}

// =============================================================================
// EXPORTS
// =============================================================================

export {
  WorkflowStateMachine,
  CheckpointSystem,
  ContextSwitchDetector,
  WorkflowManager
};
