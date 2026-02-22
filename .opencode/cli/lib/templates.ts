/**
 * Template strings for Tachikoma CLI
 * All heredocs converted to TypeScript template literals
 */

// =============================================================================
// SPEC FOLDER TEMPLATES
// =============================================================================

export const TODO_TEMPLATE = `# TODO - {taskName}
**Started**: {timestamp} | **Status**: IN PROGRESS

## Progress

- [ ] Task in progress...

## Notes
- Session slug: {slug}
- Created: {timestamp}

---

*Artifacts should be saved to: .opencode/agents/tachikoma/spec/{slug}/reports/*
`;

export const SPEC_TEMPLATE = `# SPEC - {taskName}

## Overview
[Fill in: What are we building?]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Approach
[Fill in: How will we implement this?]

## Acceptance Criteria (BDD Format)

### AC-1: [Criterion Name]
\`\`\`gherkin
Given [precondition]
When [action]
Then [outcome]
\`\`\`

### AC-2: [Criterion Name]
\`\`\`gherkin
Given [precondition]
When [action]
Then [outcome]
\`\`\`
`;

export const DESIGN_TEMPLATE = `# Design - {taskName}

## Architecture
[Fill in: High-level design]

## Data Flow
[Fill in: How data flows through the system]

## Interfaces
[Fill in: API/functions to implement]

## Error Handling
[Fill in: How errors are handled]
`;

export const TASKS_TEMPLATE = `# Tasks - {taskName}

## Context Estimate

**Target**: Use ~50% of available context
**Tasks**: 2-3 maximum (split large work into multiple plans)
**Current bracket**: [FRESH >70% | MODERATE 40-70% | DEEP 20-40% | CRITICAL <20%]

---

## Task List

### Task 1.1: [Task Name]

### Objective
[What this task accomplishes]

### Requirements
- [Requirement 1]: [Details]
- [Requirement 2]: [Details]

### Acceptance Criteria
- [ ] AC-1: [criterion this satisfies]
- [ ] AC-2: [criterion this satisfies]

### Implementation Details
- [Files to modify]: [List]
- [New files to create]: [List]
- [Dependencies]: [Other tasks or components]
- [Complexity estimate]: [Low/Medium/High]

### Verification
- [ ] Test command: [how to verify]
- [ ] Expected output: [what success looks like]

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes
- [ ] AC-1 satisfied
- [ ] AC-2 satisfied

### Checkpoint (Optional)
Use when human interaction is needed:

**checkpoint:human-verify** | **checkpoint:decision** | **checkpoint:human-action**

**What was built:**
- [Description of completed work]

**How to verify:**
1. [Step 1]
2. [Step 2]

**Resume signal:**
Type "approved" or describe issues found

---

### Task 1.2: [Task Name]

### Objective
[What this task accomplishes]

### Requirements
- [Requirement 1]: [Details]

### Acceptance Criteria
- [ ] AC-3: [criterion this satisfies]

### Implementation Details
- [Files to modify]: [List]
- [New files to create]: [List]

### Verification
- [ ] Test command: [how to verify]
- [ ] Expected output: [what success looks like]

### Done Criteria
- [ ] Code implemented
- [ ] Verification passes
- [ ] AC-3 satisfied

---

## Dependencies
- Task 1.1 → Task 1.2
- Task 1.2 → [next task]

## Notes
[Additional notes, blockers, or considerations]
`;

export const BOUNDARIES_TEMPLATE = `# Boundaries - {taskName}

## DO NOT CHANGE
- [Protected file/pattern]
- [Another protected element]

## SAFE TO MODIFY
- [Allowed file/pattern]
- [Another allowed element]

## PROTECTED PATTERNS
- [Pattern to avoid]
`;

// =============================================================================
// STATE.MD TEMPLATES
// =============================================================================

export const STATE_TEMPLATE = `# Project State

## Project Reference

**Current focus**: [Current task/milestone from projects/tasks]

---

## Current Position

**Task**: [task-slug] | **Phase**: [current phase] | **Status**: [Planning | Executing | Validating | Cleanup | Complete | Blocked]
**Last activity**: [YYYY-MM-DD HH:MM] — [What happened]

### Progress
- Task completion: [░░░░░░░░░░] 0%
- Current phase: [░░░░░░░░░░] 0%

---

## Loop Position

Current loop state:
\`\`\`
ANALYZE ──▶ DESIGN ──▶ IMPLEMENT ──▶ VALIDATE ──▶ CLEANUP
  ○        ○         ◉               ○                ○    [Current phase]
\`\`\`

---

## Performance Metrics

### Velocity
- **Total tasks completed**: 0
- **Average duration**: 0 min
- **Total execution time**: 0.0 hours

### By Task Type

| Type | Tasks | Total Time | Avg/Task |
|------|-------|------------|----------|
| implement | 0/0 | - | - |
| refactor | 0/0 | - | - |
| debug | 0/0 | - | - |
| research | 0/0 | - | - |

### Recent Trend
- Last 5 tasks: -
- Trend: Stable

*Updated after each task completion*

---

## Accumulated Context

### Decisions

Decisions logged during task execution. Recent decisions affecting current work:

| Decision | Task | Impact |
|----------|------|--------|
| *No decisions yet* | - | - |

*Full logs in spec/{task-slug}/SUMMARY.md*

---

### Deferred Issues

Issues logged but not yet addressed:

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| *No deferred issues* | - | - | - |

---

### Blockers/Concerns

Active blockers affecting progress:

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| *No active blockers* | - | - |

---

## Boundaries (Active)

Protected elements for current task (from spec/{task-slug}/boundaries.md):

*No active boundaries*

---

## Session Continuity

**Last session**: [timestamp]
**Stopped at**: [what was happening]
**Next action**: [exact next action]
**Resume context**: [key info needed]

---

## RLM State (if applicable)

**Active**: No
**Last context path**: -
**Last chunk processed**: -
**Pending results**: -

---

*STATE.md — Updated after every significant action*
*Size target: <100 lines (digest, not archive)*
`;

// =============================================================================
// HANDOFF TEMPLATE
// =============================================================================

export const HANDOFF_TEMPLATE = `# Handoff: {timestamp}

**Reason**: {reason}
**Task slug**: {taskSlug}

---

## Session Summary

### What Was Accomplished
{accomplishments}

## Current Position

**Task**: {currentTask} | **Phase**: {currentPhase} | **Status**: {currentStatus}

---

### What's In Progress

Tasks currently being worked on:

{inProgress}

---

## Key Decisions Made
{decisions}

## Accumulated Context

### Decisions

Decisions logged during task execution. Recent decisions affecting current work:

| Decision | Task | Impact |
|----------|------|--------|
| {decisionsTable} |

*Full logs in spec/{task-slug}/SUMMARY.md*

---

### Deferred Issues

Issues logged but not yet addressed:

| Issue | Origin | Effort | Revisit |
|-------|--------|--------|---------|
| {deferredTable} |

---

### Blockers/Concerns

Active blockers affecting progress:

| Blocker | Impact | Resolution Path |
|---------|--------|-----------------|
| {blockersTable} |

---

## Next Action

{nextAction}

---

## Resume Context

Key information needed to continue:
{resumeContext}

---

## Files Modified This Session

{filesModified}

---

*Handoff created: {timestamp}*
*Resume with: bun run .opencode/cli/handoff.ts resume*
`;

// =============================================================================
// SUMMARY TEMPLATE
// =============================================================================

export const SUMMARY_TEMPLATE = `# Task Summary: {taskName}

---

**Completed**: {completedTimestamp}
**Duration**: {duration} min
**Status**: {status}

---

## Performance

| Metric | Value |
|--------|-------|
| Duration | {duration} min |
| Started | {startedTimestamp} |
| Completed | {completedTimestamp} |
| Tasks | {tasksCompleted} completed |
| Files modified | {filesModified} |

---

## Acceptance Criteria Results

| Criterion | Status | Notes |
|-----------|--------|-------|
{acResults}

---

## Accomplishments

{accomplishments}

---

## Decisions Made

| Decision | Rationale | Impact |
|----------|-----------|--------|
{decisions}

---

## Deviations from Plan

| Planned | Actual | Reason |
|---------|--------|--------|
{deviations}

---

## Issues Deferred

| Issue | Effort | Revisit Trigger |
|-------|--------|-----------------|
{deferred}

---

## Files Created/Modified

| File | Change | Purpose |
|------|--------|---------|
{filesTable}

---

## Next Steps

{nextSteps}

---

## Technical Notes

{technicalNotes}

---

*SUMMARY.md — Created during UNIFY phase*
*Updates STATE.md with task completion results*
`;

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Simple template replacement
 */
export function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

/**
 * Generate slug from task name
 */
export function generateSlug(taskName: string): string {
  return taskName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .split('-')
    .slice(0, 5)
    .join('-');
}

/**
 * Get current timestamp
 */
export function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

/**
 * Get ISO timestamp
 */
export function getIsoTimestamp(): string {
  return new Date().toISOString();
}
