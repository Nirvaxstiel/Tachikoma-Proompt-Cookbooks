<p align="center">
    <img width="300px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma

Routes requests to the right specialist. Classifies intent, loads relevant context, executes.

Named after the curious AI tanks from _Ghost in the Shell_.

---

## What It Does

```
User: "Fix the auth bug"
    ↓
1. Classify: debug intent (95% confidence)
2. Load: coding-standards + commenting-rules
3. Route: code-agent skill
4. Execute: Bug fixed
```

---

## Core Concepts

| Concept | What It Means |
|---------|---------------|
| **Orchestrator** | Primary agent coordinates all activity |
| **Intent Routing** | Classifies requests, routes to appropriate skills |
| **Context Modules** | Project-specific rules load based on task type |
| **Skills** | Specialized capabilities for specific tasks |
| **Subagents** | Workers for large-context or parallel tasks |

---

## Quick Install

```bash
curl -sS https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/master/.opencode/tachikoma-install.sh | bash
```

Or copy `AGENTS.md` and `.opencode/` to your repo root.

Full guide: [docs/getting-started.md](docs/getting-started.md)

---

## Documentation

| What | Where |
|------|-------|
| Overview | [docs/concepts/overview.md](docs/concepts/overview.md) |
| Skills | [.opencode/skills/\*/SKILL.md](.opencode/skills/) |
| Customization | [docs/capabilities/customization/overview.md](docs/capabilities/customization/overview.md) |

---

## Tested Models

| Model | Notes |
|-------|-------|
| Claude 4.6 Sonnet | Current sweet spot |
| GLM 5 | Feels like Sonnet, cheaper |
| Kimi K2.5 | Strong alternative |
| Minimax M2.5 | Shockingly good |
| Gemini 3 Deep Think | ARC-AGI-2: 84.6% |

---

## Themes

Ghost in the Shell inspired themes for OpenCode terminal:

| Theme | View | Dark | Light |
|-------|------|------|-------|
| ghost-in-the-shell | Start | ![start](assets/tachikoma-dark-theme-gits-solid.png) | ![start](assets/tachikoma-light-theme-gits.png) |
| lucent-ghost-in-the-shell | Start | ![start](assets/tachikoma-dark-theme-gits-lucent.png) | ![start](assets/tachikoma-light-theme-gits.png) |

---

## Research Basis

| Paper | Basis |
|-------|-------|
| Tool-Augmented LLMs (arXiv:2601.02663) | Cost-aware routing |
| Agentic Proposing (arXiv:2602.03279) | Skill composition |
| ARC-AGI Benchmark | Intelligence efficiency |
| MIT RLM | Adaptive chunking |

RLM concept: [brainqub3/Claude Code RLM](https://github.com/brainqub3/claude_code_RLM)

---

## License

MIT
