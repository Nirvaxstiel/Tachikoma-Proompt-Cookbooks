---
name: task-tracking
description: Three-file progressive tracking system (plan/details/changes) with MANDATORY updates and divergent-change logging for accountability.
version: 2.0.0
author: tachikoma
type: skill
category: development
tags:
  - tracking
  - task-management
  - accountability
  - documentation
---

# Progressive Task Tracking System

Three-file tracking system ensuring accountability through MANDATORY documentation at every step.

## Core Philosophy

**Track everything.** Every action must be documented. Missing documentation is a failure condition.

## Three-File System Structure

### File 1: Plan File (`.opencode/agents/tachikoma/spec/{slug}/plan.md`)

**Purpose:** Define scope, objectives, all phases, and checklists

**Structure:**
```markdown
# Feature/Task: [Name]

## Overview
[Brief description]

## Phases
- [ ] Phase 1: [Name]
- [ ] Phase 2: [Name]
- [ ] Phase 3: [Name]

## Phase 1: [Name]
### Tasks
- [ ] Task 1.1: [Description]
- [ ] Task 1.2: [Description]
- [ ] Task 1.3: [Description]

### Tasks
- [ ] Task 2.1: [Description]
- [ ] Task 2.2: [Description]
...
```

---

### File 2: Details File (`.opencode/agents/tachikoma/spec/{slug}/details.md`)

**Purpose:** Complete implementation specifications for each task

**Structure:**
```markdown
# [Feature/Task]: [Name]

## Task 1.1: [Task Title]

### Objective
[What this task accomplishes]

### Requirements
- [Requirement 1]: [Details]
- [Requirement 2]: [Details]

### Implementation Details
- [Files to modify]: [List]
- [New files to create]: [List]
- [Dependencies]: [Other tasks or components]
- [Complexity estimate]: [Low/Medium/High]

### Success Criteria
- [ ] [Criterion 1]: [Definition]
- [ ] [Criterion 2]: [Definition]

## Task 1.2: [Task Title]
...
```

---

### File 3: Changes File (`.opencode/agents/tachikoma/spec/{slug}/changes.md`)

**Purpose:** Progressive tracking of all Added, Modified, Removed files

**Structure:**
```markdown
<!-- markdownlint-disable-file -->
# Release Changes: [Task Name]

**Related Plan**: [Plan file name]
**Implementation Date**: [YYYY-MM-DD]

## Summary
[Brief description of overall changes made for this release]

## Changes

### Added
- [relative-file-path] - [one sentence summary of what was implemented]

### Modified
- [relative-file-path] - [one sentence summary of what was changed]

### Removed
- [relative-file-path] - [one sentence summary of what was removed]

## Release Summary

**Total Files Affected**: [number]

### Files Created ([count])
- [file-path] - [purpose]

### Files Modified ([count])
- [file-path] - [changes made]

### Files Removed ([count])
- [file-path] - [reason]

### Dependencies & Infrastructure

- **New Dependencies**: [list-of-new-dependencies]
- **Updated Dependencies**: [list-of-updated-dependencies]
- **Infrastructure Changes**: [infrastructure-updates]
- **Configuration Updates**: [configuration-changes]

### Deployment Notes
[Any specific deployment considerations or steps]
```

---

## MANDATORY Update Protocol

### Before ANY Implementation Step

You **MUST**:

1. **Read plan file completely**
   - Understand ALL tasks, phases, checklists

2. **Read changes file completely**
   - If any parts are missing from context, re-read entire file using read_file tool
   - Understand what has been done so far

3. **Read corresponding details section**
   - For the specific task you're about to implement
   - Read entire details markdown from `.opencode/agents/tachikoma/spec/{slug}/details.md`
   - FULLY understand all implementation requirements before proceeding

4. **Gather additional context**
   - Read referenced files, examine code structure, check existing patterns

**Prohibition:** You **CANNOT** implement any task without reading its full details first.

---

### During Implementation

After completing **EACH** task:

1. **Mark task complete in plan file**
   - Change `[ ]` to `[x]` for that specific task

2. **Update changes file (MANDATORY)**
   - Append entry to appropriate section:
     - **Added** - for new files created
     - **Modified** - for existing files changed
     - **Removed** - for files deleted
   - Include relative file path
   - Include one-sentence summary of what was done

3. **Handle divergences explicitly**
   - If any implementation diverges from plan/details:
     - Specifically call it out in the relevant section
     - Include specific reason for the deviation
     - Format: `**Note: Divergence - [reason] - changed [X] to [Y]**`

4. **Mark phase complete**
   - If ALL tasks in a phase are complete `[x]`, mark phase header as complete `[x]`

---

## Divergent Change Tracking

When implementation does not match the plan/details, document the divergence:

### Divergence Template (to insert in changes file)

```markdown
- [relative-file-path] - **Note: Divergence - [specific reason] - changed [what was planned] to [what was actually implemented]**
```

### Common Divergence Scenarios

1. **Design change during implementation**
   - Reason: "Architectural decision required different approach"
   - Example: "Changed from synchronous to async pattern"

2. **Discovery of additional requirements**
   - Reason: "New dependency found during implementation"
   - Example: "Added validation library not in original plan"

3. **Technical blocker requiring alternative approach**
   - Reason: "Original approach failed due to framework limitation"
   - Example: "Used workaround due to library bug"

4. **Optimization opportunity**
   - Reason: "Performance optimization identified"
   - Example: "Changed algorithm for better complexity"

---

## Final Release Summary

**Only after ALL phases complete `[x]`:**

Add this section to changes file:

```markdown
## Release Summary

**Overall Status**: ✅ COMPLETE / ⚠️ PARTIAL / ❌ FAILED

**Implementation Duration**: [start date] to [end date]

**Total Tasks**: [X] tasks, [Y] completed

**Key Decisions**: [brief summary of architectural decisions]

**Outstanding Issues**: [list of unresolved issues or risks]

**Next Steps**: [recommended follow-up work]
```

---

## Implementation Workflow

```
1. Read and fully understand plan file and all checklists completely
2. Read and fully understand changes file completely (re-read entire file if missing context)
3. For each unchecked task:
   a. Read entire details section for that task from details markdown file
   b. FULLY understand all implementation requirements
   c. Implement task with working code following workspace patterns
   d. Validate implementation meets task requirements
   e. Mark task complete [x] in plan file
   f. Update changes file with Added, Modified, or Removed entries
   g. Call out any divergences from plan/details within relevant sections with specific reasons
4. Repeat until all tasks complete
5. Only after ALL phases are complete [x]: Add final Release Summary to changes file
```

---

## Success Criteria

Implementation is complete when:

- ✅ All plan tasks are marked complete `[x]`
- ✅ All specified files contain working code
- ✅ Code follows workspace patterns and conventions
- ✅ All functionality works as expected within the project
- ✅ Changes file is updated after **every** task completion with Added, Modified, or Removed entries
- ✅ All divergences are explicitly documented
- ✅ Final Release Summary added only after ALL phases complete

---

## When to Use This Module

Load this module when:

- Implementing complex features requiring detailed tracking
- Working with spec-driven development workflow
- Projects requiring accountability and traceability
- Multi-phase implementations with clear deliverables
- Situations where divergences need explicit documentation

---

## Stop Conditions

**Do not apply this module when:**

- Quick one-off code changes
- Simple bug fixes without spec
- Refactoring without tracking requirements
- When user wants immediate results without documentation

---

## Integration with Existing Modules

This module integrates with:

- **workflow-management**: Provides 6-phase framework that this tracking system supports
- **coding-standards**: Ensures tracked changes follow design primitives
- **git-workflow**: Manages version control for all three tracking files
