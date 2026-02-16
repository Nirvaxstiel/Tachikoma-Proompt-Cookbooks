# Intent Routing

How Tachikoma figures out what you want and routes it to the right place.

## How It Works

1. User makes request
2. Intent classifier analyzes
3. Routes match intent → skill
4. Context loads
5. Skill executes

The classifier isn't magic. It uses pattern matching, keyword analysis, and some heuristics to figure out what you're asking for. If it's not sure (low confidence), it asks instead of guessing. Much better than "do the thing" → broken build.

## Config

Edit `intent-routes.yaml`:

```yaml
routes:
  debug:
    skill: code-agent
    context_modules:
      - 00-core-contract
      - 10-coding-standards
    confidence_threshold: 0.7

  complex:
    subagent: rlm-optimized
    confidence_threshold: 0.5
```

## Options

| Option | What |
|--------|------|
| `skill` | Skill to invoke |
| `subagent` | Subagent to invoke |
| `context_modules` | Which modules to load |
| `confidence_threshold` | 0-1, when to auto-route |

## Confidence Threshold

Confidence is Tachikoma's certainty about what you want.

- **>0.8** — Strict, ask more. Good for critical tasks.
- **0.5-0.8** — Balanced (recommended). Works for most cases.
- **<0.5** — Permissive, may misroute. Risky but fast.

**Practical advice:** Keep it at 0.7. High enough to avoid bad guesses, low enough to not be annoying.

## Fallback

When confidence is low, Tachikoma doesn't just guess. It asks:

```yaml
fallback:
  low_confidence:
    action: ask
    message: "I need to clarify your request. What are you trying to do?"
```

## Pro Tips

1. Always include `core-contract` — it has the universal rules
2. Keep threshold at 0.7 — balance between safety and speed
3. Use fallback rules — better to ask than to break something
4. Test with real queries — classifier improves with patterns

## See Also

- [Context Management](/capabilities/context-management) - What context modules do
- [Add Intent](/capabilities/customization/add-intent) - How to extend routing
- [Concepts Overview](/concepts/overview) - Why we classify first
