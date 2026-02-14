---
name: workflow-management
description: Production-grade 6-phase development workflow with quality gates, confidence-based adaptation, and automated technical debt tracking.
version: 2.0.0
author: tachikoma
type: skill
category: development
tags:
  - workflow
  - process
  - quality-gates
  - documentation
---

# Spec-Driven Workflow Management

Production-grade workflow system bridging requirements to implementation with systematic quality gates and traceable documentation.

## Core Philosophy

**Never skip phases.** Each phase must complete before proceeding. Use documentation as source of truth.

## Seven-Phase Workflow Loop

### Phase 1: ANALYZE

**Objective:**
- Understand the problem
- Analyze existing system
- Produce clear, testable requirements

**Checklist:**
- [ ] Read all provided code, documentation, tests, and logs
- [ ] Document file inventory, summaries, and initial analysis results
- [ ] Define requirements in **EARS Notation**:
  - Transform feature requests into structured, testable requirements
  - Format: `WHEN [condition/event], THE SYSTEM SHALL [expected behavior]`
- [ ] Identify dependencies and constraints
- [ ] Document dependency graph with risks and mitigation strategies
- [ ] Map data flows and interactions
- [ ] Document system interaction diagrams and data models
- [ ] Catalog edge cases and failures
- [ ] Assess confidence
  - Generate a **Confidence Score (0-100%)** based on clarity, complexity, and problem scope
  - Document score and its rationale

**Critical Constraint:**
- **Do not proceed until all requirements are clear and documented**

---

### Phase 2: DESIGN

**Objective:**
- Create comprehensive technical design and detailed implementation plan

**Checklist:**
- [ ] **Define adaptive execution strategy based on Confidence Score:**
  - **High Confidence (>85%)**
    - Draft comprehensive, step-by-step implementation plan
    - Skip proof-of-concept steps
    - Proceed with full, automated implementation
    - Maintain standard comprehensive documentation
  - **Medium Confidence (66-85%)**
    - Prioritize **Proof-of-Concept (PoC)** or **Minimum Viable Product (MVP)**
    - Define clear success criteria for PoC/MVP
    - Build and validate PoC/MVP first, then expand plan incrementally
    - Document PoC/MVP goals, execution, and validation results
  - **Low Confidence (<66%)**
    - Dedicate first phase to research and knowledge-building
    - Use semantic search and analyze similar implementations
    - Synthesize findings into research document
    - Re-run ANALYZE phase after research
    - Escalate only if confidence remains low
- [ ] **Document technical design in `design.md`:**
  - **Architecture:** High-level overview of components and interactions
  - **Data Flow:** Diagrams and descriptions
  - **Interfaces:** API contracts, schemas, public-facing function signatures
  - **Data Models:** Data structures and database schemas
- [ ] **Document error handling:**
  - Create an error matrix with procedures and expected responses
- [ ] **Define unit testing strategy**
- [ ] **Create implementation plan in `tasks.md`:**
  - For each task, include description, expected outcome, and dependencies

**Critical Constraint:**
- **Do not proceed to implementation until design and plan are complete and validated**

---

### Phase 3: IMPLEMENT

**Objective:**
- Write production-quality code according to design and plan

**Checklist:**
- [ ] Code in small, testable increments
  - Document each increment with code changes, results, and test links
- [ ] Implement from dependencies upward
  - Document resolution order, justification, and verification
- [ ] Follow conventions
  - Document adherence and any deviations with a Decision Record
- [ ] Add meaningful comments
  - Focus on intent ("why"), not mechanics ("what")
- [ ] Create files as planned
- [ ] Document file creation log
- [ ] Update task status in real time

**Critical Constraint:**
- **Do not merge or deploy code until all implementation steps are documented and tested**

---

### Phase 4: VALIDATE

**Objective:**
- Verify that implementation meets all requirements and quality standards

**Checklist:**
- [ ] Execute automated tests
  - Document outputs, logs, and coverage reports
  - For failures, document root cause analysis and remediation
- [ ] Perform manual verification if necessary
  - Document procedures, checklists, and results
- [ ] Test edge cases and errors
  - Document results and evidence of correct error handling
- [ ] Verify performance
  - Document metrics and profile critical sections
- [ ] Log execution traces
  - Document path analysis and runtime behavior

**Critical Constraint:**
- **Do not proceed until all validation steps are complete and all issues are resolved**

---

### Phase 5: CLEANUP

**Objective:**
- Automated code quality cleanup to ensure production-ready code

**Checklist:**
- [ ] Run formatter skill
  - Invoke: `bash .opencode/skills/formatter/router.sh cleanup`
- [ ] Review cleanup results
  - Debug code removed (console.log, debugger)
  - Code formatted (Prettier, Black, gofmt, etc.)
  - Imports optimized
  - Linting issues fixed
  - Type checking passed
- [ ] Document any manual fixes needed
  - If type errors can't be auto-fixed, note them for manual review
- [ ] Verify no breaking changes from cleanup

**Tools Used:**
- **Formatter skill** - Automated cleanup pipeline
  - Supports: Node.js, Python, Go, Rust
  - Actions: format, lint, organize imports, type check

**Critical Constraint:**
- **Do not proceed until cleanup is complete and code is production-ready**

---

### Phase 6: REFLECT

**Objective:**
- Improve codebase, update documentation, and analyze performance

**Checklist:**
- [ ] Refactor for maintainability
  - Document decisions, before/after comparisons, and impact
- [ ] Update all project documentation
  - Ensure all READMEs, diagrams, and comments are current
- [ ] Identify potential improvements
  - Document backlog with prioritization
- [ ] Validate success criteria
- [ ] Document final verification matrix
- [ ] Perform meta-analysis
  - Reflect on efficiency, tool usage, and protocol adherence
- [ ] Auto-create technical debt issues
  - Document inventory and remediation plans

**Critical Constraint:**
- **Do not close phase until all documentation and improvement actions are logged**

---

### Phase 7: HANDOFF

**Objective:**
- Package work for review and deployment, and transition to next task

**Checklist:**
- [ ] Generate executive summary
  - Use **Compressed Decision Record** format
- [ ] Prepare pull request (if applicable):
  1. Executive summary
  2. Changelog from **Streamlined Action Log**
  3. Links to validation artifacts and Decision Records
  4. Links to final `requirements.md`, `design.md`, and `tasks.md`
- [ ] Finalize workspace
  - Archive intermediate files, logs, and temporary artifacts to `.agent_work/`
- [ ] Continue to next task
  - Document transition or completion

**Critical Constraint:**
- **Do not consider task complete until all handoff steps are finished and documented**

---

## Documentation Templates

### Action Documentation Template (All Steps/Executions/Tests)

```bash
### [TYPE] - [ACTION] - [TIMESTAMP]
**Objective**: [Goal being accomplished]
**Context**: [Current state, requirements, and reference to prior steps]
**Decision**: [Approach chosen and rationale, referencing Decision Record if applicable]
**Execution**: [Steps taken with parameters and commands used. For code, include file paths]
**Output**: [Complete and unabridged results, logs, command outputs, and metrics]
**Validation**: [Success verification method and results. If failed, include remediation plan]
**Next**: [Automatic continuation plan to next specific action]
```

### Decision Record Template (All Decisions)

```bash
### Decision - [TIMESTAMP]
**Decision**: [What was decided]
**Context**: [Situation requiring decision and data driving it]
**Options**: [Alternatives evaluated with brief pros and cons]
**Rationale**: [Why selected option is superior, with trade-offs explicitly stated]
**Impact**: [Anticipated consequences for implementation, maintainability, and performance]
**Review**: [Conditions or schedule for reassessing this decision]
```

### Summary Formats (for Reporting)

#### Streamlined Action Log

For generating concise changelogs. Each log entry is derived from a full Action Document.

`[TYPE][TIMESTAMP] Goal: [X] → Action: [Y] → Result: [Z] → Next: [W]`

#### Compressed Decision Record

For use in pull request summaries or executive summaries.

`Decision: [X] | Rationale: [Y] | Impact: [Z] | Review: [Date]`

---

## Troubleshooting & Retry Protocol

**If you encounter errors, ambiguities, or blockers:**

**Checklist:**

1. **Re-analyze:**
   - Revisit ANALYZE phase
   - Confirm all requirements and constraints are clear and complete

2. **Re-design:**
   - Revisit DESIGN phase
   - Update technical design, plans, or dependencies as needed

3. **Re-plan:**
   - Adjust implementation plan in `tasks.md` to address new findings

4. **Retry execution:**
   - Re-execute failed steps with corrected parameters or logic

5. **Escalate:**
   - If issue persists after retries, follow escalation protocol

**Critical Constraint:**
- **Never proceed with unresolved errors or ambiguities. Always document troubleshooting steps and outcomes**

---

## Technical Debt Management (Automated)

### Identification & Documentation

- **Code Quality**: Continuously assess code quality during implementation using static analysis
- **Shortcuts**: Explicitly record all speed-over-quality decisions with their consequences in a Decision Record
- **Workspace**: Monitor for organizational drift and naming inconsistencies
- **Documentation**: Track incomplete, outdated, or missing documentation

### Auto-Issue Creation Template

```text
**Title**: [Technical Debt] - [Brief Description]
**Priority**: [High/Medium/Low based on business impact and remediation cost]
**Location**: [File paths and line numbers]
**Reason**: [Why debt was incurred, linking to Decision Record if available]
**Impact**: [Current and future consequences (e.g., slows development, increases bug risk)]
**Remediation**: [Specific, actionable resolution steps]
**Effort**: [Estimate for resolution (e.g., T-shirt size: S, M, L)]
```

### Remediation (Auto-Prioritized)

- Risk-based prioritization with dependency analysis
- Effort estimation to aid in future planning
- Propose migration strategies for large refactoring efforts

---

## Quality Assurance (Automated)

### Continuous Monitoring

- **Static Analysis**: Linting for code style, quality, security vulnerabilities, and architectural rule adherence
- **Dynamic Analysis**: Monitor runtime behavior and performance in a staging environment
- **Documentation**: Automated checks for documentation completeness and accuracy (e.g., linking, format)

### Quality Metrics (Auto-Tracked)

- Code coverage percentage and gap analysis
- Cyclomatic complexity score per function/method
- Maintainability index assessment
- Technical debt ratio (e.g., estimated remediation time vs. development time)
- Documentation coverage percentage (e.g., public methods with comments)

---

## EARS Notation Reference

**EARS (Easy Approach to Requirements Syntax)** - Standard format for requirements:

- **Ubiquitous**: `THE SYSTEM SHALL [expected behavior]`
- **Event-driven**: `WHEN [trigger event] THE SYSTEM SHALL [expected behavior]`
- **State-driven**: `WHILE [in specific state] THE SYSTEM SHALL [expected behavior]`
- **Unwanted behavior**: `IF [unwanted condition] THEN THE SYSTEM SHALL [required response]`
- **Optional**: `WHERE [feature is included] THE SYSTEM SHALL [expected behavior]`
- **Complex**: Combinations of above patterns for sophisticated requirements

Each requirement must be:

- **Testable**: Can be verified through automated or manual testing
- **Unambiguous**: Single interpretation possible
- **Necessary**: Contributes to system's purpose
- **Feasible**: Can be implemented within constraints
- **Traceable**: Linked to user needs and design elements

---

## When to Use This Module

Load this module when:

- Working on multi-phase development projects
- Implementing features requiring systematic validation
- Building production-grade software with quality gates
- Projects needing spec-driven development discipline
- Situations requiring confidence-based adaptation strategies

---

## Stop Conditions

**Do not apply this module when:**

- Quick prototypes or spike research
- Simple bug fixes that don't require formal workflow
- Single-file edits or refactoring tasks
- When user requests immediate action without planning

---

## Integration with Existing Modules

This module complements:

- **coding-standards**: Provides design primitives and quality expectations
- **commenting-rules**: Ensures meaningful documentation in design artifacts
- **git-workflow**: Manages version control for phase artifacts
