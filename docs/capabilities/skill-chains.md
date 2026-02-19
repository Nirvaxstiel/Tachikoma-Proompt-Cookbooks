# Skills & Workflows

Chain skills for complex tasks. Two modes:

| Mode | How It Works | Use When |
|------|--------------|----------|
| **Workflows** | Sequential — each skill sees previous result | Fixed order matters (implement → verify → format) |
| **Skills Bulk** | All at once — agent picks what to use | Flexibility needed, agent decides approach |

---

## Workflows (Sequential)

```yaml
# .opencode/config/intent-routes.yaml
workflows:
  implement-verify:
    skills: [code-agent, verifier-code-agent, formatter]
    mode: sequential
```

Execution:
```
1. skill({ name: "code-agent" })      → generates code
2. skill({ name: "verifier-code-agent" }) → verifies result
3. skill({ name: "formatter" })       → cleans up
4. Reflect → question approach, flag issues
```

### Available Workflows

| Workflow | Skills | Use Case |
|----------|--------|----------|
| `implement-verify` | code-agent → verifier → formatter | High-reliability implementation |
| `research-implement` | research-agent → context7 → code-agent → formatter | Research then build |
| `security-implement` | context7 → code-agent → verifier → reflection | Security-critical code |
| `deep-review` | analysis-agent → reflection | Thorough code review |
| `complex-research` | research-agent → context7 → reflection | Verified research |

---

## Skills Bulk (All at Once)

```yaml
skills_bulk:
  coding-all:
    skills: [code-agent, verifier-code-agent, formatter, reflection-orchestrator]
```

Execution:
```
skill({ name: "code-agent" })
skill({ name: "verifier-code-agent" })
skill({ name: "formatter" })
skill({ name: "reflection-orchestrator" })
→ Agent has all available, picks what to use
```

### Available Skills Bulk

| Name | Skills | Use Case |
|------|--------|----------|
| `coding-all` | code-agent, verifier, formatter, reflection | Complex coding tasks |
| `research-all` | research-agent, context7, analysis-agent | Research tasks |
| `full-stack` | all coding + research skills | Maximum flexibility |

---

## When to Use What

| Task | Approach |
|------|----------|
| Routine fix | Single skill |
| Implement → verify → format | Workflow |
| Complex, unpredictable | Skills bulk |

---

## Configuration

```yaml
# Sequential workflow
workflows:
  my-workflow:
    skills: [skill-a, skill-b, skill-c]
    mode: sequential
    context_modules:
      - 00-core-contract

# Skills bulk
skills_bulk:
  my-bulk:
    skills: [skill-a, skill-b, skill-c]
```

---

## See Also

- [Intent Routing](/capabilities/intent-routing) — Route configuration
- [Skill Execution](/capabilities/skill-execution) — Individual skills
