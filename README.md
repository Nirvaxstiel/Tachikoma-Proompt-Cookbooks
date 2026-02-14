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

For detailed architecture and flow, see [AGENTS.md](./AGENTS.md).

---

## 🚀 Installation (Drop-in Framework)

### Quick Setup

1.  **Copy to your repo:**

    ```
    cp -r .opencode AGENTS.md /path/to/your/project/
    ```

2.  **Don't ignore these files:**
    - `AGENTS.md` or `.opencode/`
    - The agent needs them at repo root to pick them up.
    - Up to you if you want to commit them to your repo.

3.  **That's it.** The system wakes up and starts learning immediately.

### What Gets Copied

```
your-project/
├── AGENTS.md                          # Universal context
└── .opencode/
    ├── agents/                        # Agent definitions
    ├── skills/                        # 13 specialized skills
    ├── context/                      # Context modules
    └── config/
        └── intent-routes.yaml         # Intent → action mapping
```

See [context/navigation.md](./.opencode/context/navigation.md) for full structure.

---

## 🔧 Customizing for Your Project

### Adding Project-Specific Rules

Create a new context module in `.opencode/context/`:

```bash
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

## Testing
Always run `npm test` before committing.

## Naming
- Components: PascalCase
- Utilities: camelCase
- Constants: UPPER_CASE
EOF
```

### Adding Custom Intents

Edit `.opencode/config/intent-routes.yaml`:

```yaml
routes:
  my-custom-intent:
    description: Description of this intent
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

### Providing Feedback

The system monitors interactions for learning:

```
User: "Learn this: Always run lint before committing"
System: Detects pattern → Proposes adding to git-workflow
User: Approves → Updates context
```

---

## 📚 Documentation

| Guide | Where |
|-------|-------|
| Full architecture | [AGENTS.md](./AGENTS.md) |
| Skills reference | [skills/README.md](./.opencode/skills/README.md) |
| Context modules | [navigation.md](./.opencode/context/navigation.md) |
| Routing config | [intent-routes.yaml](./.opencode/config/intent-routes.yaml) |
| Individual skills | `.opencode/skills/*/SKILL.md` |

---

## 🛠️ Compatibility

This framework works with OpenCode and the [SKILLs](https://agentskills.io/specification) format.

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

### Research & Papers
- **Tool-Augmented LLMs** (arXiv:2601.02663) - Tool use improves accuracy 47.5% → 67.5% but adds 40x latency. Basis for cost-aware routing.
- **Agentic Proposing** (arXiv:2602.03279) - 4B proposer dynamically composes modular skills. 91.6% accuracy. Basis for skill-composer.
- **MIT RLM** - Adaptive chunking gives 2-5x efficiency on million-token tasks. Basis for rlm-optimized.

### Code & Concepts
- **RLM Concept**: Based on _Recursive Language Models_ (2025) by Zhang, Kraska, and Khattab (MIT CSAIL)
- **claude_code_RLM**: Yoinked the RLM scripts and proompts from [brainqub3/Claude Code RLM](https://github.com/brainqub3/claude_code_RLM)
- **Tachikoma**: Named after the curious, chatty, and adaptive AI tanks from *Ghost in the Shell* — always learning, always asking questions

## License

MIT — Do whatever. Fork it, hack it, use it in closed-source, whatever.

If you make it better, sharing back is cool but not required.
