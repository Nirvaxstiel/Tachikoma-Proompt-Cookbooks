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
| **Implement** | Core + coding standards + commenting rules + workflow management + task tracking |
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
    ├── modules/                       # Context modules (10 modules)
    ├── skills/                        # Specialized skills (10 skills)
    ├── agents/                        # Subagents for complex tasks
    └── runtime/                       # Runtime configuration
```

See the [full framework structure](#-framework-structure) below for details.

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
├── AGENTS.md                    # DI Registry configuration
├── README.md                    # This file
└── .opencode/
    ├── modules/                 # Context modules (10 modules)
    ├── skills/                  # Specialized skills (10 skills)
    ├── agents/                  # Subagents for complex tasks
    └── runtime/                 # Runtime configuration
```

See each directory's README for detailed listings:

- [Modules](./.opencode/modules/) - Core and context modules
- [Skills](./.opencode/skills/) - Specialized skills
- [Agents](./.opencode/agents/) - Subagents for complex tasks

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
- **Workflow Management**: 6-phase spec-driven development workflow with quality gates
- **Task Tracking**: Progressive 3-file tracking system for accountability
- **Agent Orchestration**: Sequential agent workflows with guided handoffs
- **Prompt Safety**: Comprehensive safety frameworks, bias mitigation, and compliance

### Composite Intents

Some tasks need multiple modules:

- "Add feature and test it" → `implement` + `debug` modules load
- "Research this API then use it" → `research` + `implement` modules load
- "Refactor and verify" → `implement` + `debug` modules load
- "Build production feature" → `implement` + `workflow management` + `task tracking` modules load

### Self-Learning

The system watches for patterns and gets smarter over time:

- You repeat the same reminder 3 times → proposes new rule
- You say "learn this" → creates module proposal
- Agent confidence drops → suggests module update
- Auto-discovers validation commands (npm test, pytest, etc.)

You approve changes; agent implements. It's like training a tiny assistant.

### Specialized Skills

Pre-built workflows for common tasks:

- **Code Review**: Structured review with priority-based classification (CRITICAL/IMPORTANT/SUGGESTION)
- **Prompt Engineer**: Comprehensive safety frameworks, bias mitigation, and responsible AI usage
- **Security Audit**: OWASP-based vulnerability assessment and security best practices

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
