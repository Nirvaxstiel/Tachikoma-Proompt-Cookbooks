# Add Agent

Create specialized subagents for complex, large-context tasks.

## Overview

In Tachikoma, there are two types of agents:

### 1. Primary Agent (Tachikoma)

The **orchestrator** that:
- Receives all user input
- Classifies intent
- Routes to skills or subagents
- Coordinates execution
- Synthesizes results

The primary agent is **not customizable** - it follows the rules in `AGENTS.md`.

### 2. Subagents

Specialized workers that:
- Handle complex, large-context tasks
- Operate with their own context window
- Execute multi-step reasoning pipelines
- Process 10M+ tokens via chunking

Subagents **are customizable** and are defined in `.opencode/agents/subagents/`.

## When to Create a Subagent

Create a new subagent when you need to:

- ✅ Process large codebases or documents (>2000 tokens)
- ✅ Perform complex, multi-step reasoning
- ✅ Handle specialized domain tasks requiring deep context
- ✅ Implement research-grade analysis workflows
- ✅ Coordinate parallel processing of multiple contexts

**Don't create a subagent when:**
- ❌ The task is simple or routine (use a skill instead)
- ❌ The task fits in normal context window (use a skill instead)
- ❌ The task is one-off (not reusable)
- ❌ A skill can handle it with skill chains

## Subagent Architecture

### Core Components

A subagent consists of:

```
.opencode/agents/subagents/my-subagent/
├── SUBAGENT.md          # Agent definition and rules
├── capabilities.md       # What this subagent can do
└── tools.md             # Tool access and limitations
```

### SUBAGENT.md Format

```yaml
---
name: my-subagent
description: A clear description of what this subagent does
category: specialized-processing
version: "1.0"
author: tachikoma
---

# My Subagent

## Purpose

[What this subagent is for]

## When to Use

[When Tachikoma should delegate to this subagent]

## Capabilities

[What this subagent can do]

## Limitations

[What this subagent cannot do]

## Workflow

[Step-by-step process for this subagent]
```

## Creating a Subagent

### Step 1: Create Subagent Directory

```bash
mkdir -p .opencode/agents/subagents/my-subagent
```

### Step 2: Create SUBAGENT.md

```yaml
---
name: codebase-auditor
description: Perform comprehensive codebase audits including security, performance, and quality analysis across entire codebases.
category: specialized-analysis
version: "1.0"
author: tachikoma
---
```

```markdown
# Codebase Auditor

## Purpose

Perform deep, comprehensive analysis of entire codebases to identify:
- Security vulnerabilities
- Performance bottlenecks
- Quality issues
- Architecture problems
- Dependency risks

## When to Use

Tachikoma should delegate to this subagent when:
- User requests analysis of entire codebase
- Task involves >2000 tokens of code
- Analysis requires cross-file understanding
- Multiple analysis perspectives are needed (security + performance + quality)

## Capabilities

### Security Analysis
- OWASP Top 10 vulnerability scanning
- Dependency vulnerability checking
- Secret/credential detection
- Input validation review
- Authentication/authorization analysis

### Performance Analysis
- Algorithm complexity analysis
- Database query optimization
- Caching strategy review
- Memory usage profiling
- API response time analysis

### Quality Analysis
- Code duplication detection
- Design pattern violations
- Code smell identification
- Test coverage gaps
- Documentation completeness

### Architecture Analysis
- Coupling/cohesion assessment
- Design principle adherence
- Pattern usage review
- Scalability concerns
- Technical debt identification

## Limitations

- Cannot execute code (static analysis only)
- Limited by available tool access
- May miss runtime-only issues
- Requires understanding of project context
- Analysis is best-effort, not exhaustive

## Workflow

### Phase 1: Context Collection
1. Discover all relevant files
2. Load project configuration
3. Identify key modules
4. Understand project structure

### Phase 2: Chunking
1. Break codebase into semantic chunks
2. Respect natural boundaries (files, modules, functions)
3. Create metadata for each chunk
4. Maintain dependency relationships

### Phase 3: Parallel Analysis
1. Process chunks in parallel (3-5 at a time)
2. Apply different analysis types to each chunk
3. Identify cross-cutting concerns
4. Track findings by location

### Phase 4: Synthesis
1. Aggregate findings across chunks
2. Prioritize by severity and impact
3. Generate actionable recommendations
4. Create comprehensive report

### Phase 5: Reporting
1. Executive summary (high-level findings)
2. Detailed findings (with locations)
3. Prioritized recommendations
4. Estimated effort for fixes

## Tools Available

- `Read`: Read any file in the codebase
- `Grep`: Search for patterns across files
- `Bash`: Run analysis tools if available
- `task`: Invoke rlm-subcall for chunk processing

## Output Format

### Executive Summary
```
## High-Level Findings

- [X] Critical security vulnerabilities: 3
- [X] High-performance issues: 5
- [X] Major quality concerns: 8
- [X] Architecture risks: 2
```

### Detailed Findings
```
### Security: SQL Injection in User Module
**Location:** `src/users/auth.py:45`
**Severity:** Critical
**Description:** User input is directly concatenated into SQL query.
**Recommendation:** Use parameterized queries.
```

### Recommendations
```
### Priority 1 (Fix Immediately)
1. [Fix SQL injection] - src/users/auth.py:45
2. [Fix XSS vulnerability] - src/web/templates/profile.html:89

### Priority 2 (Fix This Week)
3. [Add input validation] - src/api/validators.py
4. [Implement rate limiting] - src/api/middleware.py
```

## Error Handling

If analysis fails:
1. Identify the failure point
2. Report what was analyzed successfully
3. Suggest recovery actions
4. Offer to retry with modified scope

## Context Requirements

Requires:
- Access to all source files
- Project configuration files
- Dependencies list (package.json, requirements.txt, etc.)
- Build configuration if applicable
```

### Step 3: Register Subagent in intent-routes.yaml

Open `.opencode/config/intent-routes.yaml` and add:

```yaml
routes:
  codebase-audit:
    description: Perform comprehensive codebase audits
    confidence_threshold: 0.6
    context_modules:
      - 00-core-contract
      - 10-coding-standards
    subagent: codebase-auditor
    tools:
      - Read
      - Grep
      - Bash
    strategy: subagent
    notes: Use for large codebase analysis
```

### Step 4: Update Intent Classifier (Optional)

If creating a new intent type, update `.opencode/skills/intent-classifier/SKILL.md`:

```markdown
### Codebase Audit Patterns
- Keywords: `audit`, `analyze entire codebase`, `comprehensive review`, `codebase security`, `full analysis`
- Indicators: User mentions "entire", "all files", "comprehensive", "full codebase"
```

## Subagent Types

### Type 1: Context Processor

Specializes in processing large contexts via chunking.

**Example:** `rlm-optimized`

```yaml
---
name: large-context-processor
description: Process large contexts using semantic chunking and parallel processing.
category: context-processing
version: "1.0"
---

# Large Context Processor

## Purpose

Efficiently process contexts that exceed normal token limits.

## Capabilities

- Semantic chunking
- Parallel processing
- Result synthesis
- Confidence-weighted merging

## Workflow

1. Chunk context (semantic boundaries)
2. Process chunks in parallel
3. Synthesize results
4. Return aggregated output
```

### Type 2: Domain Specialist

Specializes in a specific domain requiring deep knowledge.

**Example:** `security-specialist`

```yaml
---
name: security-specialist
description: Perform deep security analysis with domain-specific expertise.
category: domain-specialization
version: "1.0"
---

# Security Specialist

## Purpose

Perform comprehensive security audits with OWASP expertise.

## Capabilities

- Vulnerability scanning
- Threat modeling
- Compliance checking
- Security best practices

## Domain Knowledge

- OWASP Top 10
- CWE/SANS Top 25
- Security frameworks
- Industry standards
```

### Type 3: Workflow Orchestrator

Specializes in managing complex multi-step workflows.

**Example:** `deployment-orchestrator`

```yaml
---
name: deployment-orchestrator
description: Manage complex deployment workflows with rollback capabilities.
category: workflow-orchestration
version: "1.0"
---

# Deployment Orchestrator

## Purpose

Orchestrate full deployment pipelines with safety nets.

## Capabilities

- Multi-stage deployment
- Automated testing
- Rollback on failure
- Status monitoring

## Workflow

1. Pre-deployment checks
2. Build and test
3. Staging deployment
4. Production deployment
5. Post-deployment verification
6. Rollback if needed
```

## Subagent vs Skill Decision Matrix

Use this guide to decide when to use a subagent vs a skill:

| Task Type | Best Approach | Reasoning |
|-----------|--------------|-----------|
| Fix a bug in one file | **Skill**: `code-agent` | Simple, focused task |
| Create a new component | **Skill**: `code-agent` | Straightforward implementation |
| Review entire codebase | **Subagent**: `codebase-auditor` | Large context, complex analysis |
| Analyze security across 50+ files | **Subagent**: `security-specialist` | Domain expertise, large context |
| Deploy to production | **Skill**: `workflow-management` + skill chain | Process, not large context |
| Research complex topic | **Subagent**: `research-subagent` | Deep analysis needed |
| Merge a pull request | **Skill**: `git-commit` | Simple git operation |
| Refactor entire codebase | **Subagent**: `refactor-specialist` | Large-scale changes |

## Subagent Communication

### From Tachikoma to Subagent

When Tachikoma delegates to a subagent, it provides:

```markdown
This task must be performed by subagent "{subagent_name}".

CONTEXT LOADED:
- [list of loaded context modules]

USER REQUEST:
{user_query}

CLASSIFICATION:
- Intent: {intent}
- Confidence: {confidence}
- Reasoning: {reasoning}

Execute this task following the loaded context and return a summary of actions taken.
```

### From Subagent to Tachikoma

When the subagent completes, it returns:

```markdown
## Execution Summary

**Task:** {task description}
**Subagent:** {subagent name}
**Duration:** {time taken}

## Actions Taken

1. [action 1]
2. [action 2]
3. [action 3]

## Results

- [result 1]
- [result 2]
- [result 3]

## Files Changed

- [file 1]: {change summary}
- [file 2]: {change summary}

## Next Steps

[recommendations for follow-up]
```

## Complete Example

Here's a complete example of creating a custom subagent:

### Scenario

You need a subagent that specializes in database migration analysis.

### Step 1: Create Directory

```bash
mkdir -p .opencode/agents/subagents/database-migration-specialist
```

### Step 2: Create SUBAGENT.md

```yaml
---
name: database-migration-specialist
description: Analyze and plan database migrations across complex schemas, identify risks, and generate migration scripts.
category: domain-specialization
version: "1.0"
author: tachikoma
---
```

```markdown
# Database Migration Specialist

## Purpose

Plan and analyze database migrations with minimal downtime and data loss.

## When to Use

Tachikoma should delegate when:
- User needs to migrate database schema
- Multiple tables are involved
- Data transformation is required
- Migration risk assessment is needed

## Capabilities

- Schema analysis
- Dependency mapping
- Migration script generation
- Rollback planning
- Risk assessment

## Workflow

### 1. Schema Discovery
1. Read current schema
2. Identify all affected tables
3. Map relationships
4. Detect dependencies

### 2. Migration Planning
1. Determine migration order
2. Identify data transformation needs
3. Plan for downtime
4. Create rollback strategy

### 3. Risk Assessment
1. Assess data loss risk
2. Identify breaking changes
3. Estimate downtime duration
4. Plan fallback options

### 4. Generate Scripts
1. Create migration scripts
2. Create rollback scripts
3. Add validation queries
4. Document changes

### 5. Reporting
1. Provide migration summary
2. List risks and mitigations
3. Provide step-by-step guide
4. Include rollback instructions

## Tools Available

- `Read`: Read schema files
- `Grep`: Search for table/column references
- `Bash`: Run database tools if available
- `Write`: Generate migration scripts

## Output Format

### Migration Plan

```markdown
## Migration Plan: {migration_name}

### Scope
- Tables affected: {count}
- Records to migrate: {count}
- Estimated downtime: {time}

### Migration Order
1. {table_1}
2. {table_2}
3. ...

### Risks
- [High] {risk description}
- [Medium] {risk description}
- [Low] {risk description}

### Rollback Plan
[Detailed rollback instructions]
```

## Constraints

- Cannot execute DDL statements (analysis only)
- Requires access to schema definitions
- Assumes source database is accessible
- No guarantee of zero downtime without testing
```

### Step 3: Register in intent-routes.yaml

```yaml
routes:
  database-migration:
    description: Plan and analyze database migrations
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
    subagent: database-migration-specialist
    tools:
      - Read
      - Write
      - Grep
      - Bash
    strategy: subagent
    notes: Use for complex database migration planning
```

### Step 4: Test

```bash
# Test the subagent
"Plan a migration to add user_id foreign key to orders table"
```

## Best Practices

### ✅ DO

1. **Define clear scope**
   - Specific, focused purpose
   - Clear when to use
   - Well-defined capabilities

2. **Provide context requirements**
   - What context is needed
   - What tools are available
   - What limitations exist

3. **Handle errors gracefully**
   - Identify failure points
   - Provide recovery guidance
   - Report partial results

4. **Return structured output**
   - Clear summary
   - Actionable findings
   - Next steps

### ❌ DON'T

1. **Don't duplicate skills**
   - Subagents for simple tasks
   - Overlap with skill capabilities
   - Unnecessary complexity

2. **Don't ignore constraints**
   - Tool limitations
   - Context window limits
   - Execution time

3. **Don't over-promise**
   - Be realistic about capabilities
   - Document limitations
   - Provide caveats

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Subagent not invoked | Check intent routing configuration |
| Subagent fails silently | Add error handling to SUBAGENT.md |
| Results not comprehensive | Improve chunking strategy |
| High latency | Reduce scope or improve parallelization |

## See Also

- [Subagents](/capabilities/subagents) - How subagents work
- [Skill Execution](/capabilities/skill-execution) - How skills work
- [Skill Chains](/capabilities/skill-chains) - Chaining skills for complex tasks
- [Add Skill](/capabilities/customization/add-skill) - Creating skills
