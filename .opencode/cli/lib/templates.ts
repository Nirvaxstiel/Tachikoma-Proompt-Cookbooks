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
[What are we building?]

## Requirements
- [ ] Requirement 1
- [ ] Requirement 2

## Approach
[How will we implement this?]

## Acceptance Criteria (BDD)

### AC-1: [Criterion Name]
\`\`\`gherkin
Given [precondition]
When [action]
Then [outcome]
\`\`\`
`;

export const DESIGN_TEMPLATE = `# Design - {taskName}

## Architecture
[High-level design]

## Data Flow
[How data flows through the system]

## Interfaces
[API/functions to implement]

## Error Handling
[How errors are handled]
`;

export const TASKS_TEMPLATE = `# Tasks - {taskName}

**Target**: ~50% context, 2-3 tasks max, split large work

---

## Task 1.1: [Task Name]

**Objective**: [What this accomplishes]

**Requirements**:
- [Req 1]: [Details]

**Acceptance Criteria**: AC-1, AC-2

**Implementation**:
- Files to modify: [List]
- Dependencies: [Other tasks]

**Verification**:
- Test: [how to verify]
- Expected: [what success looks like]

**Checkpoint** (optional):
- Type: human-verify | decision | human-action
- What was built: [description]
- Resume: "approved" or describe issues

---

## Dependencies
- Task 1.1 → Task 1.2

**Notes**: [blockers, considerations]
`;

export const BOUNDARIES_TEMPLATE = `# Boundaries - {taskName}

## DO NOT CHANGE
- [Protected file/pattern]

## SAFE TO MODIFY
- [Allowed file/pattern]

## PROTECTED PATTERNS
- [Pattern to avoid]
`;

export const STATE_TEMPLATE = `# Project State

## Current Position

**Task**: [task-slug] | **Phase**: [current phase] | **Status**: [Planning | Executing | Complete | Blocked]
**Last activity**: [YYYY-MM-DD HH:MM] — [What happened]

---

## Performance

| Tasks | Avg Duration |
|-------|-------------|
| 0 | 0 min |

---

## Accumulated Context

**Decisions**:
| Decision | Task | Impact |
|----------|------|--------|
| *None* | - | - |

*Full logs in spec/{task-slug}/SUMMARY.md*

**Blockers**: *None*

**Boundaries**: *None*

---

## Session Continuity

**Last**: [timestamp]
**Next action**: [exact next action]
**Resume**: [key info needed]

---

*Updated after each significant action | Target: <100 lines*
`;

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

// Minimal template for simple tasks (complexity < 0.3)
export const SUMMARY_TEMPLATE_LITE = `# Task Summary: {taskName}

---

**Completed**: {completedTimestamp}
**Duration**: {duration} min
**Status**: {status}

---

## What Was Done

{accomplishments}

---

## Files Modified

{filesModified}

---

## Next Steps

{nextSteps}

---
*Quick summary for simple task*
`;

export function fillTemplate(template: string, values: Record<string, string>): string {
  let result = template;
  for (const [key, value] of Object.entries(values)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export function getSummaryTemplate(isSimple: boolean): string {
  return isSimple ? SUMMARY_TEMPLATE_LITE : SUMMARY_TEMPLATE;
}

export function generateSlug(taskName: string): string {
  return taskName
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .split('-')
    .slice(0, 5)
    .join('-');
}

export function getTimestamp(): string {
  return new Date().toISOString().replace('T', ' ').slice(0, 16);
}

export function getIsoTimestamp(): string {
  return new Date().toISOString();
}
