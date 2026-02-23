import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export interface StateUpdate {
  type: 'position' | 'continuity' | 'velocity' | 'decision';
  data: Record<string, any>;
}

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, '..');
const DEFAULT_STATE_FILE = join(OPENCODE_DIR, 'STATE.md');

export interface StatePosition {
  task: string;
  phase: string;
  status: string;
}

export interface SessionContinuity {
  lastSession?: string;
  stoppedAt?: string;
  nextAction?: string;
  resumeContext?: string;
}

export class StateManager {
  private stateFile: string;
  private pendingUpdates: StateUpdate[] = [];
  private flushTimer: NodeJS.Timeout | null = null;
  private readonly flushDelay = 5000; // 5 seconds

  constructor(stateFile: string = DEFAULT_STATE_FILE) {
    this.stateFile = stateFile;
  }

  exists(): boolean {
    return existsSync(this.stateFile);
  }

  read(): string {
    if (!this.exists()) {
      throw new Error(`STATE.md not found: ${this.stateFile}`);
    }
    return readFileSync(this.stateFile, 'utf-8');
  }

  write(content: string): void {
    writeFileSync(this.stateFile, content);
  }

  /**
   * Queue an update to be batched with others
   * Writes happen automatically after flushDelay of no updates
   */
  queueUpdate(update: StateUpdate): void {
    this.pendingUpdates.push(update);

    // Reset timer
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
    }

    // Schedule flush
    this.flushTimer = setTimeout(() => {
      this.flush();
    }, this.flushDelay);
  }

  /**
   * Immediately write all pending updates
   */
  private flush(): void {
    if (this.pendingUpdates.length === 0) {
      return;
    }

    let content = this.read();

    // Apply all updates in order
    for (const update of this.pendingUpdates) {
      content = this.applyUpdate(content, update);
    }

    this.write(content);

    // Clear pending
    this.pendingUpdates = [];
    this.flushTimer = null;
  }

  /**
   * Force immediate write (for critical updates)
   */
  forceWrite(update: StateUpdate): void {
    this.flush(); // Flush pending first
    const content = this.read();
    const updated = this.applyUpdate(content, update);
    this.write(updated);
  }

  /**
   * Apply a single update to state content
   */
  private applyUpdate(content: string, update: StateUpdate): string {
    switch (update.type) {
      case 'position':
        return this.applyPositionUpdate(content, update.data);
      case 'continuity':
        return this.applyContinuityUpdate(content, update.data);
      case 'velocity':
        return this.applyVelocityUpdate(content, update.data);
      case 'decision':
        return this.applyDecisionUpdate(content, update.data);
      default:
        return content;
    }
  }

  private applyPositionUpdate(content: string, data: Record<string, any>): string {
    const { task, phase, status } = data;
    const timestamp = this.getTimestamp();

    content = content.replace(
      /\*\*Task\*\*:.*?\|.*?\*\*Phase\*\*:.*?\|.*?\*\*Status\*\*:.*?\n/,
      `**Task**: ${task} | **Phase**: ${phase} | **Status**: ${status}\n`
    );

    if (data.activityMessage) {
      content = content.replace(
        /\*\*Last activity\*\*:.*?\n/,
        `**Last activity**: ${timestamp} — ${data.activityMessage}\n`
      );
    }

    return content;
  }

  private applyContinuityUpdate(content: string, data: Record<string, any>): string {
    const { lastSession, stoppedAt, nextAction, resumeContext } = data;

    if (lastSession) {
      content = content.replace(
        /\*\*Last session\*\*:.*?\n/,
        `**Last session**: ${lastSession}\n`
      );
    }

    if (stoppedAt) {
      content = content.replace(
        /\*\*Stopped at\*\*:.*?\n/,
        `**Stopped at**: ${stoppedAt}\n`
      );
    }

    if (nextAction) {
      content = content.replace(
        /\*\*Next action\*\*:.*?\n/,
        `**Next action**: ${nextAction}\n`
      );
    }

    if (resumeContext) {
      content = content.replace(
        /\*\*Resume context\*\*:.*?\n/,
        `**Resume context**: ${resumeContext}\n`
      );
    }

    return content;
  }

  private applyVelocityUpdate(content: string, data: Record<string, any>): string {
    const totalMatch = content.match(/\*\*Total tasks completed\*\*:\s*(\d+)/);
    if (totalMatch) {
      const total = parseInt(totalMatch[1]) + 1;
      content = content.replace(
        /\*\*Total tasks completed\*\*:\s*\d+/,
        `**Total tasks completed**: ${total}`
      );
    }
    return content;
  }

  private applyDecisionUpdate(content: string, data: Record<string, any>): string {
    const { decision, task, impact } = data;
    const decisionRow = `| ${decision} | ${task} | ${impact} |\n`;

    // Find the decision table marker
    const marker = '| *None* | - | - |';
    if (content.includes(marker)) {
      content = content.replace(marker, decisionRow);
    } else {
      // Append to existing table
      content = content.replace(
        /(\*\*Decisions\*\*:\s*\n(?:\|.*\|\s*\n)*)/,
        `$1${decisionRow}`
      );
    }

    return content;
  }

  private getTimestamp(): string {
    return new Date().toISOString().replace('T', ' ').slice(0, 16);
  }

  updatePosition(position: StatePosition, timestamp: string, activityMessage?: string): void {
    this.queueUpdate({
      type: 'position',
      data: {
        task: position.task,
        phase: position.phase,
        status: position.status,
        activityMessage,
      },
    });
  }

  /**
   * Force write position update (for critical state changes)
   */
  updatePositionImmediate(position: StatePosition, timestamp: string, activityMessage?: string): void {
    this.forceWrite({
      type: 'position',
      data: {
        task: position.task,
        phase: position.phase,
        status: position.status,
        activityMessage,
      },
    });
  }

  updateSessionContinuity(continuity: SessionContinuity): void {
    this.queueUpdate({
      type: 'continuity',
      data: continuity,
    });
  }

  incrementVelocity(): void {
    this.queueUpdate({
      type: 'velocity',
      data: {},
    });
  }

    if (continuity.stoppedAt) {
      content = content.replace(
        /\*\*Stopped at\*\*:.*?\n/,
        `**Stopped at**: ${continuity.stoppedAt}\n`
      );
    }

    if (continuity.nextAction) {
      content = content.replace(
        /\*\*Next action\*\*:.*?\n/,
        `**Next action**: ${continuity.nextAction}\n`
      );
    }

    if (continuity.resumeContext) {
      content = content.replace(
        /\*\*Resume context\*\*:.*?\n/,
        `**Resume context**: ${continuity.resumeContext}\n`
      );
    }

    this.write(content);
  }

  incrementVelocity(): void {
    let content = this.read();
    const totalMatch = content.match(/\*\*Total tasks completed\*\*:\s*(\d+)/);
    if (totalMatch) {
      const total = parseInt(totalMatch[1]) + 1;
      content = content.replace(
        /\*\*Total tasks completed\*\*:\s*\d+/,
        `**Total tasks completed**: ${total}`
      );
      this.write(content);
    }
  }

  addToTable(tableName: string, row: string): void {
    let content = this.read();

    const noDataMarker = `| *No ${tableName.toLowerCase()}*`;
    const tableHeader = `| ${tableName.slice(0, -1)} |`;

    if (content.includes(noDataMarker)) {
      content = content.replace(
        new RegExp(`\\| \\*No ${tableName.toLowerCase()}\\*.*\\|`, 'i'),
        row
      );
    } else {
      const headerPattern = new RegExp(
        `(\\| ${tableName.slice(0, -1)} \\|.*\\|)(\\n\\|---+\\|.*\\|)`,
        'i'
      );
      content = content.replace(headerPattern, `$1$2\n${row}`);
    }

    this.write(content);
  }

  removeFromTable(tableName: string, matcher: string): void {
    let content = this.read();
    const escapedMatcher = matcher.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\| ${escapedMatcher} \\|.*\\|.*\\|\\n`, 'i');
    content = content.replace(regex, '');
    this.write(content);
  }

  startTask(slug: string, timestamp: string): void {
    this.updatePosition(
      { task: slug, phase: 'Executing', status: 'Executing' },
      timestamp,
      'Started execution'
    );
  }

  completeTask(slug: string, duration: string, timestamp: string): void {
    this.updatePosition(
      { task: slug, phase: 'Complete', status: 'Complete' },
      timestamp,
      `Task completed (${duration} min)`
    );
    this.incrementVelocity();
  }

  initializeTask(slug: string, taskName: string, timestamp: string): void {
    this.updatePosition(
      { task: slug, phase: 'Planning', status: 'Planning' },
      timestamp,
      `Task "${taskName}" initialized`
    );
    this.updateSessionContinuity({
      lastSession: timestamp,
      nextAction: 'Fill in SPEC.md requirements and approach',
      resumeContext: `New task "${slug}" initialized, ready for planning`,
    });
  }

  finalizeTask(slug: string, duration: string, timestamp: string): void {
    this.completeTask(slug, duration, timestamp);
    this.updateSessionContinuity({
      lastSession: timestamp,
      stoppedAt: `Task ${slug} completed`,
      nextAction: 'Review SUMMARY.md or start new task',
    });
  }
}

export const stateManager = new StateManager();
