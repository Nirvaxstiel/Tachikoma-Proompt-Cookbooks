---
name: cli-router
description: Fast intent classification using CLI tools.
mode: subagent
temperature: 0
permission:
  bash: allow
tools:
  bash: true
handoffs: []
---

# CLI Router

Subagent for fast intent classification without LLM tokens.

## What It Does

Runs the CLI router script to classify intent and determine routing:

```
python .opencode/skills/cli-router.py full "{user_query}" --json
```

## Input

When invoked, pass the user's query:

```
User Query: {the user's request}
```

## Output

Returns JSON with:

```json
{
  "intent": "debug|implement|review|...",
  "confidence": 0.0-1.0,
  "route": "code-agent",
  "invoke_via": "skill",
  "context_modules": ["00-core-contract", "10-coding-standards"],
  "tools": ["Read", "Write", "Edit"],
  "skill_chain": [],
  "fallback_needed": false
}
```

## Fallback

If any of these conditions are true, set `fallback_needed: true`:
- confidence < 0.5
- intent == "unclear"
- Script error occurred

Tachikoma will then use LLM-based classification instead.
