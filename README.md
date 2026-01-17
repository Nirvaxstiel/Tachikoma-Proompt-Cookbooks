<p align="center">
    <img width="500px" src= "assets/tachikoma1.png" alt="tachikoma1.png">
</p>

# Tachikoma Proompt Cookbooks 🕷️

**One-time Boot manuals for curious AI agents learning the shape of your repo**

Include a template **once** at the start of a new AI context.
The agent explores the repo, then **writes a tailored agent file for that project**.
From then on, the generated file is what you reuse.

When the context window fills:
open a new chat → include the generated file → continue working

---

## How This Is Meant to Be Used

1. Pick a template
   - [Tachikoma Agent Bootstrap](bootstrap/TACHIKOMA_AGENT_BOOTSTRAP.md)
   - [Tachikoma Agent Bootstrap - Non Code](bootstrap/TACHIKOMA_AGENT_BOOTSTRAP_NON_CODE.md)
2. Start a **new AI context / session**
3. Include the template **once**
4. Ask the agent to:
   - Explore the repo
   - Infer patterns, constraints, conventions
   - **Generate a project-specific agent file**

5. Save that file in the appropriate location
6. Work normally using the generated file as context

When context maxes out:

- Start a new session
- Include the **generated file**, not the template
- Continue

Templates are for **bootstrapping**.
Generated files are for **daily use**.

---

## SKILL Support

This repo also plays nice with **SKILL format** for Claude Code and OpenCode:

1. Open `bootstrap/TACHIKOMA_AGENT_BOOTSTRAP.md` in your agent
2. Agent scaffolds `.cli-agent/skills/` folder structures
3. Agent fills in project-specific content and generates SKILL.md files
4. rename `.cli-agent` to your agent of choosing - `.claude` | `.opencode` | `.gemini` or whichever

**Locations:**
- Claude Code: `.claude/skills/<skill>/SKILL.md` or `~/.claude/skills/`
- OpenCode: `.opencode/skill/<skill>/SKILL.md` or `~/.config/opencode/skill/`

See [docs/SKILLS_GUIDE.md](docs/SKILLS_GUIDE.md) for the nitty-gritty.

---

## Output Locations Summary

### SKILL Format

| Platform | File/Folder |
|-------------|----------|
| Claude Code | `.claude/skills/<name>/SKILL.md` |
| Claude Code | `.claude/skill/<name>/SKILL.md` |
| OpenCode | `.opencode/skill/<name>/SKILL.md` |
| OpenCode | `.gemini/skill/<name>/SKILL.md` |
| OpenCode | `~/.config/opencode/skill/<name>/SKILL.md` |

### Agent Instructions


| Tool / Platform | Primary Project-Level Path(s) |
| :--- | :--- |
| **Claude Code** | `.claude/skills/<skill-name>/SKILL.md` |
| **Cursor** | `.cursorrules`, `.cursor/rules` |
| **Gemini CLI** | `.gemini/skills/<skill-name>/` (if using project-specific skills) |
| **GitHub Copilot** | `.github/copilot-instructions.md`<br>`.github/instructions/*.instructions.md` |
| **Kiro** | `.kiro/specs/<domain>/` (for requirements, design, tasks) and `.kiro/steering/` for rules |
| **OpenCode** | `.opencode/skill/<skill-name>/SKILL.md`<br>`AGENTS.md` (general project instructions) |
| **Roo Code** | `.roo/rules/` (directory for `.md` files) |
| **Tabnine** | `.tabnine/` (directory) |
| **Windsurf** | `.windsurfrules`, `.windsruf/rules` |
| **Zed Editor** | `.rules` (also checks for: `.cursorrules`, `.windsurfrules`, `.clinerules`, `CLAUDE.md`, `AGENTS.md`) |

### Kiro's Specs-Based Approach

Kiro uses a **workflow documentation** approach with specs organized by domain:

```
.kiro/specs/
├── user-authentication/       # Login, signup, password reset
├── product-catalog/           # Product listing, search, filtering
├── shopping-cart/             # Add to cart, checkout
└── payment-processing/        # Gateway integration, orders
```

| Spec File | Purpose |
|-----------|---------|
| `requirements.md` | User stories + acceptance criteria (EARS notation) |
| `design.md` | Technical architecture, sequence diagrams |
| `tasks.md` | Implementation plan with status tracking |

Format: `WHEN [condition] THE SYSTEM SHALL [behavior]`

Not sure where to put it? `.github/agent.md` works just about everywhere.

---

## Works Best With

### Editors / IDEs

**Best**

* **VS Code + Copilot**
* **Zed + Copilot**

**Okay**

* **Visual Studio (Enterprise) + Copilot**
  *(works, but… yeah)*

---

### Models / Agents

**Best experience so far**

* **Claude 4**
* **Claude 4.5 Sonnet**
* **Claude 4.5 Opus**

**Mixed (experiment, YMMV)**

* **OpenAI**

   * GPT-4 series — hit or miss; try different agents
   * GPT-5 — generally better, still inconsistent; experiment

**Not recommended**

* **Grok models** — no ❤️

**Promising**

* **Gemini 3+** — decent results, needs more tuning

---

### Tools to Watch 👀

**Haven't used heavily yet, but liked the vibes**

* **Opencode**
* **RooCode**

Will probably reach for these more once the setup (and mood) is right.

---

### Notes

Copilot is doing a lot of the heavy lifting here —
work pays for it, so I'm turning the knobs and trying **every model it'll let me** 😄

---

### Disclaimer

AI agents vary wildly by model, tool, and prompt plumbing.
**Your mileage may vary.**
Experiment and trust local results over lists like this.
