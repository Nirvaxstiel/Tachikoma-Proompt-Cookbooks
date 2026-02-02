<p align="center">
    <img width="500px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma Proompt Cookbooks 🕷️

**Boot manuals and Recursive Skills for AI agents exploring your repository.**

Drop this into any repo and watch your agent grow a mind of its own:

1.  **Dependency Injection Context System**: Modular rules that load based on what you're doing
2.  **Intent Classification**: Auto-detects task type and loads the right brain cells
3.  **Self-Learning**: System learns from your feedback, curious little thing

**Like the AI tanks from Ghost in the Shell, but for code.**

---

## 🧠 Dependency Injection Context System

Every message, the agent perks up, figures out what you're doing, and loads the right brain modules:

**How it works:**

1.  **Detect intent**: Are you debugging? Implementing? Researching?
2.  **Load modules**: Core rules (always) + Context modules (task-specific)
3.  **Execute**: Your request with full context, auto-validating as needed
4.  **Report**: Shows you what's loaded (no black box magic)

**What changes based on what you're doing:**
| Intent | What Loads |
|--------|-----------|
| **Implement** | Core + coding standards + commenting rules |
| **Debug** | Core + coding standards |
| **Research** | Core + research methods |
| **Review** | Core + coding standards + delegation patterns |
| **Git** | Core + git workflow conventions |
| **Complex tasks** | Core + delegation patterns → rlm-subcall agent |

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
├── AGENTS.md                          # DI Registry (config + modules)
└── .opencode/
    ├── modules/                       # Context modules (00, 10, 15, 20, 25, 30)
    │   ├── 00-core-contract.md        # Foundational rules
    │   ├── 10-coding-standards.md     # Design primitives
    │   ├── 15-commenting-rules.md     # Minimal commenting ⭐
    │   ├── 20-git-workflow.md         # Git conventions
    │   ├── 25-delegation-patterns.md  # When to use subagents
    │   └── 30-research-methods.md     # Research framework
    ├── skills/                        # Specialized skills
    │   ├── code-agent/                # Debug, implement, edit
    │   ├── analysis-agent/            # Code review
    │   ├── research-agent/            # Investigation
    │   ├── git-commit/                # Commit messages
    │   ├── pr/                        # Pull requests
    │   ├── rlm/                       # Recursive context management
    │   └── self-learning/             # Self-improvement
    └── runtime/
        └── intent_lookup.yaml         # Quick intent lookup
```

### Customizing for Your Project

The system is opinionated but adaptable:

**Add project-specific rules:**

```bash
# Create a new module
echo "module_id: my-project-rules
priority: 40
depends_on: [core-contract, coding-standards]" > .opencode/modules/40-my-project.md
```

**Add custom intents:**
Edit `AGENTS.md` → Add to `intent_bundles` section

**Teach new patterns:**

```
"Learn this: Always run `npm run lint` before committing"
→ System proposes adding to git-workflow module
```

---

## 📂 Framework Structure

```text
tachikoma-proompt-cookbooks/
├── AGENTS.md                    # DI Registry configuration (YAML + docs)
├── .opencode/
│   ├── modules/                 # Context modules (core + task-specific)
│   │   ├── 00-core-contract.md           # Non-negotiable foundational rules
│   │   ├── 10-coding-standards.md        # Design primitives, patterns, style
│   │   ├── 15-commenting-rules.md        # Minimal commenting philosophy ⭐
│   │   ├── 20-git-workflow.md            # Git conventions, validation commands
│   │   ├── 25-delegation-patterns.md     # When/how to use subagents
│   │   └── 30-research-methods.md         # Research, source evaluation
│   ├── skills/                  # Specialized agent skills
│   │   ├── code-agent/                    # Debug, implement, edit
│   │   ├── analysis-agent/                # Code review, evaluation
│   │   ├── research-agent/                # Investigation
│   │   ├── git-commit/                    # Commit messages
│   │   ├── pr/                            # Pull requests
│   │   ├── rlm/                           # Recursive context management
│   │   └── self-learning/                 # Self-improvement
│   ├── agents/                  # Subagents for complex tasks
│   │   ├── intent-director/AGENT.md       # Intent classification
│   │   └── rlm-subcall.md                 # Large context chunking
│   ├── runtime/                # Runtime configuration
│   │   ├── intent_lookup.yaml             # Quick intent lookup table
│   │   └── PLAN_TO_BUILD_INTENT.md        # Intent persistence
│   └── old-bootstrapper/        # Legacy one-time templates
│       ├── TACHIKOMA_AGENT_BOOTSTRAP.md   # Code repos
│       └── TACHIKOMA_AGENT_BOOTSTRAP_NON_CODE.md  # Non-code repos
└── examples/                   # Example implementations
```

## 🎯 What This Actually Does

### Core Modules (Always Loaded)

- **Core Contract**: Minimal change, validation before action, stop conditions
- Loads first, establishes the rules of engagement

### Context Modules (Intent-Based)

- **Coding Standards**: Design primitives, patterns, style bias
- **Commenting Rules**: No obvious comments, explain business rules only
- **Git Workflow**: Conventional commits, validation commands, safety rules
- **Delegation Patterns**: When to use subagents, what to delegate
- **Research Methods**: Evidence-driven, source evaluation, confidence labeling

### Composite Intents

Some tasks need multiple modules:

- "Add feature and test it" → `implement` + `debug` modules load
- "Research this API then use it" → `research` + `implement` modules load
- "Refactor and verify" → `implement` + `debug` modules load

### Self-Learning

The system watches for patterns and gets smarter over time:

- You repeat the same reminder 3 times → proposes new rule
- You say "learn this" → creates module proposal
- Agent confidence drops → suggests module update
- Auto-discovers validation commands (npm test, pytest, etc.)

You approve changes; agent implements. It's like training a tiny assistant.

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
