<p align="center">
    <img src = "assets/tachikoma1.png" alt="tachikoma1.png">
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

## Where the Generated File Lives

Save the **generated agent file** somewhere the IDE or agent can auto-load, or somewhere convenient to paste from.

### Common Locations (Recommended)

#### GitHub / Repo-level

- `.github/agent.md`
- `.github/ai-instructions.md`

#### Cursor

- `.cursor/agent.md`
- `.cursor/rules.md`

#### VS Code

- `.vscode/agent.md`
- `.vscode/ai-context.md`

#### Visual Studio

- `.github/agent.md`
  _(or repo root for manual inclusion)_

#### Kiro

- `.kiro/agent.md` _(or tool-default folder)_

#### Zed

- `.zed/agent.md`
- Repo root for manual loading

If your tool has a default “agent rules” location, use that.
Otherwise, `.github/agent.md` is a safe, portable default.
