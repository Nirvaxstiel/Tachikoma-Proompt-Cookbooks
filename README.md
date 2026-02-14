<p align="center">
    <img width="500px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma Proompt Cookbooks 🕷️

**Agent coordination system for AI-assisted development.**

A modular framework that helps AI agents understand your project structure, follow your conventions, and route tasks to appropriate specialists.

**Core Concepts:**

1.  **Orchestrator Pattern**: Primary agent (Tachikoma) coordinates all activity
2.  **Intent-Based Routing**: Classifies requests and routes to appropriate skills/subagents  
3.  **Context Modules**: Project-specific rules that load based on task type
4.  **Self-Learning**: Tracks patterns and suggests improvements

Named after the adaptive AI tanks from *Ghost in the Shell* — always learning, always asking questions.

---

## 🧠 How It Works

This system uses a **primary orchestrator** pattern where Tachikoma (the primary agent) handles all incoming requests, classifies them, and routes to the appropriate specialist.

### Architecture Overview

```
User Request
    ↓
Tachikoma (Primary Agent)
    ↓
Intent Classification (skill)
    ↓
Route Decision (config-driven)
    ↓
    ├── Simple Task → Skill (e.g., code-agent)
    ├── Complex Task → Subagent (e.g., rlm-subcall)
    └── Ambiguous → Ask user for clarification
```

### Request Processing Flow

1.  **Receive**: Tachikoma receives the user request
2.  **Classify**: Loads `intent-classifier` skill to determine intent and confidence
3.  **Load Context**: Reads relevant context modules from `.opencode/context/`
4.  **Route**: Checks `.opencode/config/intent-routes.yaml` for routing rules
5.  **Execute**: Either handles directly (skills) or delegates (subagents)
6.  **Report**: Returns results with routing details and confidence levels

### Intent Routing Table

| Intent | Context Modules Loaded | Execution Target | Use Case |
|--------|----------------------|------------------|----------|
| **debug** | core-contract, coding-standards | code-agent skill | Fixing bugs and errors |
| **implement** | core-contract, coding-standards, commenting-rules | code-agent skill | Writing new code |
| **research** | core-contract, research-methods | research-agent skill | Finding information |
| **review** | core-contract, coding-standards | analysis-agent skill | Code analysis |
| **git** | core-contract, git-workflow | git-commit / pr skills | Version control |
| **complex** | core-contract | rlm-subcall subagent | Large context processing |

**Note:** The orchestrator loads context modules in priority order (lower numbers first) before executing any task.

---

## 📝 Planning vs Implementation

Tachikoma has full tool access (read, write, edit, bash). Depending on your workflow preference:

### Option A: Plan First (Recommended for complex work)

**When to use:** Large features, refactoring, or when you want to review before executing

1. **Start with OpenCode's built-in Plan agent** (or your IDE's planning mode)
   - Read-only analysis
   - Explore the codebase
   - Create implementation plan
   - No risk of accidental changes

2. **When ready to implement, press Tab and switch to Tachikoma**
   - Tachikoma receives the plan
   - Executes with context modules loaded
   - Can make changes, run commands, delegate to subagents

**Benefits:** 
- Peace of mind during exploration
- Review plan before committing to changes
- Clear separation between analysis and implementation

### Option B: Let Tachikoma Handle Everything

**When to use:** Simple tasks, quick fixes, or when you're confident in the approach

1. **Stay on Tachikoma from the start**
   - Tachikoma classifies your request
   - Loads appropriate context
   - Routes to skills or subagents automatically
   - Executes immediately

**Benefits:**
- Faster for straightforward tasks
- No context switching
- Full automation

---

## 🚀 Installation (Drop-in Framework)

### Quick Setup

1.  **Copy to your repo:**

    ```
    cp -r .opencode AGENTS.md /path/to/your/project/
    ```

2.  **Don't ignore these these files:**
    - `AGENTS.md` or `.opencode/`
    - The agent needs them at repo root to pick them up.
    - Up to you if you want to commit them to your repo.

3.  **That's it.** The system wakes up and starts learning immediately.

### What Gets Copied

```
your-project/
├── AGENTS.md                          # Universal context and system overview
└── .opencode/
    ├── agents/                        # Agent definitions
    │   ├── tachikoma.md              # Primary orchestrator (always-on)
    │   └── subagents/                # Specialized subagents
    │       └── core/
    │           ├── rlm-subcall.md    # Large context processor
    │           └── rlm-optimized.md # MIT-style adaptive chunking
    ├── skills/                        # Specialized skills (13 skills)
    │   ├── intent-classifier/        # Intent detection
    │   ├── code-agent/               # Implementation
    │   ├── analysis-agent/           # Code review
    │   ├── research-agent/           # Investigation
    │   ├── git-commit/               # Git operations
    │   ├── pr/                       # Pull requests
    │   ├── workflow-management/      # 7-phase workflow
    │   ├── task-tracking/            # Task management
    │   ├── context-manager/          # Context operations
    │   ├── context7/                 # Live documentation
    │   ├── formatter/                # Code quality cleanup
    │   └── skill-composer/           # Dynamic skill composition
    ├── context/                       # Context modules (reference docs)
    │   ├── 00-core-contract.md
    │   ├── 10-coding-standards.md
    │   ├── 15-commenting-rules.md
    │   ├── 20-git-workflow.md
    │   ├── 30-research-methods.md
    │   └── 50-prompt-safety.md
    └── config/                        # Routing configuration
        └── intent-routes.yaml         # Intent → action mapping
```

See the [full framework structure](#-framework-structure) below for details.

### Customizing for Your Project

**Adding Project-Specific Rules:**

Create a new context module in `.opencode/context/`:

```bash
# Create context module with appropriate priority (40-60 range)
cat > .opencode/context/40-my-project.md << 'EOF'
---
module_id: my-project-rules
name: My Project Patterns
priority: 40
depends_on:
  - core-contract
  - coding-standards
---

# My Project Specific Rules

## Testing Requirements
Always run `npm test` before committing.

## Naming Conventions
- Components: PascalCase
- Utilities: camelCase  
- Constants: UPPER_CASE

## Project Structure
src/
  components/    # React components
  utils/         # Helper functions
  types/         # TypeScript definitions
EOF
```

**Adding Custom Intents:**

Edit `.opencode/config/intent-routes.yaml`:

```yaml
routes:
  my-custom-intent:
    description: Description of what this intent means
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 40-my-project
    skill: code-agent
    tools:
      - Read
      - Write
      - Bash
```

**Providing Feedback:**

The system monitors interactions for learning opportunities:

```
User: "Learn this: Always run lint before committing"
System: Detects pattern → Proposes adding to git-workflow context
User: Approves → Updates git-workflow.md
```

**Confidence Thresholds:**

Adjust routing sensitivity in `intent-routes.yaml`:
- High threshold (>0.8): Strict routing, more user clarification
- Low threshold (<0.5): Permissive routing, may misroute

---

## 📂 Framework Structure

```text
tachikoma-proompt-cookbooks/
├── AGENTS.md                    # Universal context and system overview
├── README.md                    # This file
└── .opencode/
    ├── agents/                  # Agent definitions
    │   ├── tachikoma.md         # Primary orchestrator (always-on)
    │   └── subagents/           # Specialized subagents
    │       └── core/
    │           └── rlm-subcall.md
    ├── skills/                  # Specialized skills (13 skills)
    │   ├── intent-classifier/   # Intent classification
    │   ├── code-agent/          # Implementation
    │   ├── analysis-agent/      # Code review
    │   ├── research-agent/      # Investigation
    │   ├── git-commit/          # Git operations
    │   ├── pr/                  # Pull requests
    │   ├── workflow-management/ # 7-phase workflow
    │   ├── task-tracking/       # Task management
    │   ├── context-manager/     # Context operations
    │   ├── context7/            # Live documentation
    │   ├── formatter/           # Code quality cleanup
    │   └── skill-composer/     # Dynamic skill composition
    ├── context/                 # Context modules (reference docs)
    │   ├── 00-core-contract.md
    │   ├── 10-coding-standards.md
    │   ├── 15-commenting-rules.md
    │   ├── 20-git-workflow.md
    │   ├── 30-research-methods.md
    │   └── 50-prompt-safety.md
    ├── config/                  # Configuration
    │   └── intent-routes.yaml   # Intent routing
    └── runtime/                 # Runtime state
```

See each directory's README for detailed listings:

- [Agents](./.opencode/agents/) - Primary agent and subagents
- [Skills](./.opencode/skills/) - Specialized capabilities
- [Context](./.opencode/context/) - Reference modules

## 🎯 System Components

### Primary Agent (Tachikoma)

Located at `.opencode/agents/tachikoma.md`, this is the main entry point that coordinates all activity:

**Responsibilities:**
- Intent classification via `intent-classifier` skill
- Context module loading based on classified intent
- Route determination via `intent-routes.yaml` config
- Skill/subagent invocation
- Result synthesis and reporting

**Configuration:**
- Mode: `primary` (TAB-switchable agent)
- Temperature: `0` (deterministic)
- Full tool access with task invocation permissions

### Context Modules

Reference documentation in `.opencode/context/` that defines project standards:

| Module | File | Purpose | Load Priority |
|--------|------|---------|---------------|
| Core Contract | `00-core-contract.md` | Foundational rules, precedence, minimal change | 0 (always first) |
| Coding Standards | `10-coding-standards.md` | Design patterns, style guidelines | 10 |
| Commenting Rules | `15-commenting-rules.md` | Comment philosophy and requirements | 15 |
| Git Workflow | `20-git-workflow.md` | Commit conventions, validation commands | 20 |
| Research Methods | `30-research-methods.md` | Investigation methodology | 30 |
| Prompt Safety | `50-prompt-safety.md` | Safety frameworks and compliance | 50 |

**Usage:** Tachikoma loads these in priority order before executing any task. Lower priority numbers load first.

### Skills

Executable capabilities in `.opencode/skills/` that perform specific tasks:

| Skill | Location | Purpose |
|-------|----------|---------|
| Intent Classifier | `intent-classifier/SKILL.md` | Classify user queries into intents |
| Code Agent | `code-agent/SKILL.md` | Implementation and debugging |
| Analysis Agent | `analysis-agent/SKILL.md` | Code review and evaluation |
| Research Agent | `research-agent/SKILL.md` | Investigation and fact-finding |
| Git Commit | `git-commit/SKILL.md` | Git operations |
| PR | `pr/SKILL.md` | Pull request creation |
| Workflow Management | `workflow-management/SKILL.md` | 7-phase development workflow |
| Task Tracking | `task-tracking/SKILL.md` | Task management system |
| Context Manager | `context-manager/SKILL.md` | Context discovery and extraction (0 tokens) |
| Context7 | `context7/SKILL.md` | Live documentation fetch |
| Formatter | `formatter/SKILL.md` | Code quality cleanup |
| Skill Composer | `skill-composer/SKILL.md` | Dynamic skill composition |

**Invocation:** Tachikoma reads the SKILL.md file and applies its patterns to the current task.

### Subagents

Specialized agents in `.opencode/agents/subagents/` for isolated or complex work:

| Subagent | Location | Use Case |
|----------|----------|----------|
| RLM Subcall | `core/rlm-subcall.md` | Large context processing (base RLM) |
| RLM Optimized | `core/rlm-optimized.md` | Large context with MIT-style adaptive chunking (2-5x efficiency) |

**Invocation:** Via `task(subagent_type="rlm-subcall", ...)` or `task(subagent_type="rlm-optimized", ...)` from Tachikoma.

### Configuration

**`.opencode/config/intent-routes.yaml`** - Defines routing logic:

```yaml
routes:
  debug:
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 10-coding-standards
    skill: code-agent
    
  implement:
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 15-commenting-rules
    skill: code-agent
```

### Self-Learning Mechanisms

The system includes feedback loops for improvement:

1. **Pattern Detection**: Identifies repeated user corrections
2. **Confidence Tracking**: Monitors classification accuracy
3. **Tool Discovery**: Auto-detects project validation commands
4. **Proposal Generation**: Suggests context module updates

**Note:** All learning proposals require user approval before implementation.

### Pre-Built Workflows

Additional specialized skills included:

- **Code Review**: Priority-based review classification
- **Prompt Engineer**: Safety and bias mitigation patterns
- **Security Audit**: OWASP-based vulnerability scanning

## 🛠️ Compatibility

This framework is designed to play nice with OpenCode and the [SKILLs](https://agentskills.io/specification) format.

**Should work with:**

- Any AI agent that can read files from your repo
- Local models via Ollama, LM Studio, etc.
- Custom agent integrations

---

### Editors / IDEs

| Tier     | Tool                                 | Notes                    |
| -------- | ------------------------------------ | ------------------------ |
| **Best** | Zed + Copilot/Open Code              | Honestly the best so far |
| **Best** | VS Code/Cursor/Kiro + Copilot        | Just works, good stuff.  |
| **Okay** | Visual Studio (Enterprise) + Copilot | I mean... it works...    |

---

### Models / Agents

| Tier                         | Model             | Notes                                                              |
| ---------------------------- | ----------------- | ------------------------------------------------------------------ |
| **PAUSECHAMP?**              | Kimi K2.5         | This might be better than sonnet or opus depending on your usecase |
| **SOLID**                    | Claude 4.5 Sonnet | Sweet spot: smart + fast.                                          |
| **SOLID**                    | Claude 4.5 Opus   | Big brain energy.                                                  |
| **Shockingly Good**          | GLM 4.7           | Almost as good as Claude 4.5 Sonnet                                |
| **Shockingly Good**          | Minimax M2        | Very close to GLM 4.7, I switch between the two                    |
| **Mixed (experiment, YMMV)** | GPT-4 series      | Hit or miss; try different agents, some shine.                     |
| **Mixed (experiment, YMMV)** | GPT-5 series      | Generally better, still inconsistent; worth poking.                |
| **Not recommended, for now** | Grok models       | No ❤️.                                                             |
| **Promising**                | Gemini 3+         | Good vibes, needs tuning.                                          |

---

### Notes

Copilot is doing a lot of the heavy lifting here —
work pays for it, so I'm turning the knobs and trying **every model it'll let me** 😄

---

### Disclaimer

AI agents vary wildly by model, tool, and prompt plumbing.
**Your mileage may vary.**
Experiment and trust local results over lists like this.

---

## Credits

- **RLM Concept**: Based on _Recursive Language Models_ (2025) by Zhang, Kraska, and Khattab (MIT CSAIL)
- **claude_code_RLM**: Yoinked the RLM scripts and proompts from [brainqub3/Claude Code RLM](https://github.com/brainqub3/claude_code_RLM)
- **Tachikoma**: Named after the curious, chatty, and adaptive AI tanks from _Ghost in the Shell_ — always learning, always asking questions

## License

MIT — Do whatever. Fork it, hack it, use it in closed-source, whatever.

If you make it better, sharing back is cool but not required.
