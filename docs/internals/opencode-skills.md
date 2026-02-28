---
title: Skills System
description: How OpenCode discovers, loads, and executes skills.
---

## Skills System

Skills are reusable capability modules. They're loaded on demand based on task context.

## Skill Definition

A skill is a directory with a `SKILL.md` file:

```
skill-name/
├── SKILL.md          # Required: name, description, instructions
├── scripts/          # Optional: executable scripts
├── references/       # Optional: reference documentation
└── assets/           # Optional: static resources
```

## SKILL.md Format

```yaml
---
name: skill-name
description: What this skill does and when to use it.
license: Apache-2.0 # Optional
compatibility: Requires git # Optional
metadata: # Optional
  author: example-org
  version: "1.0"
  allowed-tools: Bash(git:*) Read # Optional: pre-approved tools
---
# Instructions

Step-by-step instructions for agent...
```

## Discovery Paths

Skills are discovered in this order:

```typescript
// packages/opencode/src/skill/skill.ts
const EXTERNAL_DIRS = [".claude", ".agents"]
const EXTERNAL_SKILL_GLOB = "skills/**/SKILL.md"
const OPENCODE_SKILL_GLOB = "{skill,skills}/**/SKILL.md"

// Discovery order:
1. ~/.claude/skills/**/SKILL.md      # Global external
2. ~/.agents/skills/**/SKILL.md      # Global external
3. .claude/skills/**/SKILL.md        # Project external
4. .agents/skills/**/SKILL.md        # Project external
5. .opencode/skill/**/SKILL.md       # Project opencode
6. .opencode/skills/**/SKILL.md      # Project opencode
7. config.skills.paths               # Custom paths
8. config.skills.urls                # Remote URLs
```

## Skill Loading

```typescript
// packages/opencode/src/skill/skill.ts
namespace Skill {
  // Skill info structure
  const Info = z.object({
    name: z.string(),
    description: z.string(),
    location: z.string(), // File path to SKILL.md
    content: z.string(), // Full markdown content
  });

  // Get skill by name
  async function get(name: string): Promise<Info>;

  // Get all skills
  async function all(): Promise<Info[]>;

  // Get skill directories
  async function dirs(): Promise<string[]>;
}
```

## Remote Skills

Skills can be loaded from URLs:

```json
// opencode.json
{
  "skills": {
    "urls": ["https://example.com/.well-known/skills/"]
  }
}
```

Remote skills require an `index.json`:

```json
{
  "skills": [
    {
      "name": "skill-name",
      "description": "Description",
      "files": ["SKILL.md", "scripts/helper.py"]
    }
  ]
}
```

## Progressive Disclosure

Skills are loaded in stages:

1. **Metadata** (~100 tokens): `name` and `description` loaded at startup
2. **Instructions** (< 5000 tokens): Full `SKILL.md` loaded when skill is activated
3. **Resources** (as needed): Scripts, references, assets loaded on demand

After loading, reflect:

- Was skill content sufficient?
- Should I add more instructions?
- Are there edge cases to document?

## Skill Tool

The `skill` tool loads a skill into context:

```typescript
// Usage in agent
skill({ name: "skill-name" });

// Returns skill content
```

## Built-in Skills

OpenCode includes some built-in skills:

```
.opencode/skill/
└── bun-file-io/
    └── SKILL.md    # Bun file I/O patterns
```

## Creating a Skill

### 1. Create directory

```bash
mkdir -p .opencode/skill/my-skill
```

### 2. Create SKILL.md

```markdown
---
name: my-skill
description: Use this when working with X. Handles Y and Z.
---

## When to Use

- Task involves X
- User mentions Y

## Instructions

1. First step
2. Second step
3. ...

## Examples

Example inputs and outputs...
```

### 3. Add optional resources

```
my-skill/
├── SKILL.md
├── scripts/
│   └── helper.py
└── references/
    └── REFERENCE.md
```

## Skill Validation

Use skills-ref validate:

```bash
skills-ref validate ./my-skill
```

## Name Constraints

- 1-64 characters
- Lowercase letters, numbers, hyphens only
- Cannot start or end with hyphen
- No consecutive hyphens (`--`)
- Must match directory name

## Description Best Practices

Good:

```yaml
description: Extracts text from PDFs, fills forms, merges documents. Use when working with PDF files or when user mentions PDFs.
```

Poor:

```yaml
description: Helps with PDFs.
```

## Duplicate Handling

If multiple skills have the same name, last one loaded wins:

```typescript
// Warning logged
log.warn("duplicate skill name", {
  name: parsed.data.name,
  existing: skills[parsed.data.name].location,
  duplicate: match,
});
```

## Integration with Tachikoma

Tachikoma uses Agent Skills format for its skills:

```
.opencode/skills/
├── dev/SKILL.md
├── think/SKILL.md
├── plan/SKILL.md
├── meta/SKILL.md
└── context/SKILL.md
```

This ensures compatibility with the open standard while providing Tachikoma-specific functionality.

## Tachikoma Core Skills

### dev

**Purpose:** Code implementation, verification, and refactoring

**When to use:** Implementation tasks, bug fixes, code improvements

**Includes:**

- GVR pattern (Generate-Verify-Revise)
- Refactoring methods
- Model-aware editing

### think

**Purpose:** Functional thinking principles for code design

**When to use:** Design decisions, architectural choices, refactoring

**Includes:**

- 16 functional thinking principles
- Decision questions
- Common refactor patterns

### plan

**Purpose:** Structured planning with PAUL methodology

**When to use:** Multi-step features, roadmap creation, complex tasks

**Includes:**

- PLAN phase: Objectives, acceptance criteria
- APPLY phase: Execution with verification
- UNIFY phase: Loop closure
- State management

### meta

**Purpose:** Self-generating agent orchestration

**When to use:** Complex multi-step tasks, parallel exploration, dynamic tool creation

**Includes:**

- Vertical decomposition
- Horizontal ensemble
- Dynamic tool synthesis
- Memory operations (with context skill)

### context

**Purpose:** Knowledge retrieval and management

**When to use:** Research, documentation queries, large context processing

**Includes:**

- Codebase exploration
- External documentation (Context7)
- Graph-based memory
- RLM for 10M+ token contexts
