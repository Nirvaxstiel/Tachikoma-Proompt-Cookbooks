<p align="center">
    <img width="500px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma Proompt Cookbooks 🕷️

**Boot manuals and Recursive Skills for AI agents exploring your repository.**

This repository provides two distinct workflows for enhancing AI agents (Claude Code, OpenCode, etc.):

1.  **Bootstrap Templates:** One-time manuals to help an agent "learn" a specific project.
2.  **Agent Skills:** Skills for intent classification, routing, and recursive context management.

---

## 🧠 Agent & Skill System (RLM & Beyond)

This system routes tasks based on intent classification:

1.  **Classify Intent:** Consult `intent_lookup.yaml` to determine task type
2.  **Execute:** Route to appropriate handler
    - `code-agent` skill → Debug, implement, edit tasks
    - `research-agent` skill → Investigation, finding information
    - `analysis-agent` skill → Code review, evaluation
    - `git-commit` / `pr` skills → Version control
    - `rlm-subcall` agent → Large context chunking
3.  **Use Built-in Modes:** CLI modes (`plan`, `mode`) for planning and context switching

---

## 🚀 Workflow 1: Agent Skills (Recommended)

Skills that enable intent classification and routing:

1.  **Classify Intent First:** Before any task, consult `intent_lookup.yaml`
2.  **Execute:** Load the skill or invoke the agent specified in the lookup entry
3.  **Self-Improve:** Confidence scores update based on execution success

### Installation

1.  **Clone this repo**
2.  Copy `.opencode` and `AGENTS.md` to your project repo
    - Avoid putting your agent instruction files into the `.gitignore` (`AGENTS.md`, `.opencode/`, `.claude/`).
    - Keep them out of the so that the agent can pick them up from the repo root.
3.  (Optional) Tell the agent to trawl and update project-specific lore to the SKILL.md and AGENTS.md available
    - Use built-in modes like `plan` for planning and `mode` for context switching
4.  The system will classify intents and execute based on the lookup table

| Platform        | Source Path in Repo | Destination Path on Local Machine                        |
| :-------------- | :------------------ | :------------------------------------------------------- |
| **Claude Code** | `.claude/skills/`   | `~/.claude/skills/` or `.claude/skills/` (project-level) |
| **OpenCode**    | `.opencode/skill/`  | `~/.config/opencode/skill/` or `.opencode/skill/`        |

---

## 📦 Workflow 2: One-Time Bootstrap (Legacy)

**Best for:** Quick exploration of a new repo without modifying agent config, or generating a static "map" of a project to share with others.

### How to Use

1.  **Pick a template** from the `.opencode/old-bootstrapper` folder (e.g., `TACHIKOMA_AGENT_BOOTSTRAP.md`).
2.  **Start a new AI session.**
3.  **Paste the template** into the chat **once**.
4.  The agent will:
    - Explore the repo.
    - Infer patterns and conventions.
    - **Generate a project-specific agent file** (e.g., `MY_PROJECT_AGENT.md`).
5.  **Save that file.**
6.  **Future Sessions:** Do not use the template. Instead, upload the generated `MY_PROJECT_AGENT.md` at the start of the chat.
    You can also save this as `AGENTS.md` in your root directory and the agent will pick it up for you.

---

## 📂 Repository Structure

```text
.
├── AGENTS.md                               # Example project-specific instructions
├── .opencode/                              # Skills and agents for OpenCode
│   ├── agent/
│   │   ├── intent-director/                # Intent classification agent
│   │   │   └── AGENT.md
│   │   └── rlm-subcall.md                  # RLM subagent for large contexts
│   ├── skill/
│   │   ├── code-agent/                     # Debug, implement, edit
│   │   ├── analysis-agent/                 # Code review, evaluation
│   │   ├── research-agent/                 # Investigation
│   │   ├── git-commit/                     # Commit changes
│   │   ├── pr/                             # Pull requests
│   │   ├── rlm/                            # Recursive context management
│   │   └── self-learning/                  # Self-improvement
│   └── runtime/
│       ├── intent_lookup.yaml              # Intent→strategy lookup
│       └── PLAN_TO_BUILD_INTENT.md         # Intent persistence across modes
├── .claude/                                # Skills formatted for Claude Code
└── examples/                               # Example implementations
```

## 🛠️ Supported Platforms & Paths

This repo is designed to play nice with the **SKILL format**.

| Tool            | Primary Skill Path                      | File        |
| :-------------- | :-------------------------------------- | :---------- |
| **Claude Code** | `.claude/skills/<skill_name>/SKILL.md`  | `AGENTS.md` |
| **OpenCode**    | `.opencode/skill/<skill_name>/SKILL.md` | `AGENTS.md` |

---

### Editors / IDEs

| Tier     | Tool                                 | Notes                   |
| -------- | ------------------------------------ | ----------------------- |
| **Best** | VS Code/Cursor/Kiro + Copilot        | Just works, good stuff. |
| **Best** | Zed + Copilot                        | Shockingly good.        |
| **Okay** | Visual Studio (Enterprise) + Copilot | I mean... it works...   |

---

### Models / Agents

| Tier                         | Model             | Notes                                               |
| ---------------------------- | ----------------- | --------------------------------------------------- |
| **Best experience so far**   | Claude 4          | Consistently solid.                                 |
| **Best experience so far**   | Claude 4.5 Sonnet | Sweet spot: smart + fast.                           |
| **Best experience so far**   | Claude 4.5 Opus   | Big brain energy.                                   |
| **Mixed (experiment, YMMV)** | GPT-4 series      | Hit or miss; try different agents, some shine.      |
| **Mixed (experiment, YMMV)** | GPT-5 series      | Generally better, still inconsistent; worth poking. |
| **Not recommended, for now** | Grok models       | No ❤️.                                              |
| **Promising**                | Gemini 3+         | Good vibes, needs tuning.                           |

---

### Tools to Watch 👀

| Tier          | Tool     | Notes                                             |
| ------------- | -------- | ------------------------------------------------- |
| **Primary**   | Opencode | Built-in modes (plan, mode, agent) for execution |
| **Promising** | RooCode  | Pretty good                                       |

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

- **RLM Concept:** Based on _Recursive Language Models_ (2025) by Zhang, Kraska, and Khattab (MIT CSAIL).
- **Tachikoma:** Named after the curious, chatty, and adaptive AI tanks from _Ghost in the Shell_.
- **claude_code_RLM:** Yoinked the RLM scripts and proompts from [brainqub3/Claude Code RLM](https://github.com/brainqub3/claude_code_RLM)
- **Intent Delegation:** Self-learning intent classification and subagent routing system (2026)
