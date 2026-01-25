# Plan-to-Build Intent Persistence

## Problem

When user confirms plan and switches to build mode, the original intent is lost.

## Solution

Store intent from plan mode, retrieve in build mode, continue with intent-director pipeline.

## Workflow

```
Plan Mode
  ↓ User confirms plan
  ↓ Write intent to `.opencode/runtime/current_intent.yaml`
  ↓ Exit plan mode

Build Mode
  ↓ Read `.opencode/runtime/current_intent.yaml`
  ↓ If exists, USE IT (skip intent classification)
  ↓ Execute with stored intent
  ↓ Update confidence in intent_lookup.yaml
```

## Implementation

### In Plan Mode (after user confirms)

```python
# Write confirmed intent
intent_data = {
    "intent": "debug|implement|review|...",
    "strategy": "direct|rlm",
    "tools": ["R", "G", "B"],
    "skills": ["code-agent"],
    "original_query": "...",
    "confirmed_at": "2026-01-21T10:00:00Z"
}

with open(".opencode/runtime/current_intent.yaml", "w") as f:
    yaml.dump(intent_data, f)
```

### In Build Mode (at start)

```python
# Check for stored intent
intent_file = Path(".opencode/runtime/current_intent.yaml")

if intent_file.exists():
    with open(intent_file) as f:
        intent_data = yaml.safe_load(f)
    
    # USE THIS INTENT - skip classification
    intent = intent_data["intent"]
    strategy = intent_data["strategy"]
    tools = intent_data["tools"]
    skills = intent_data["skills"]
    
    print(f"Using intent from plan: {intent}")
else:
    # No stored intent - run normal classification
    intent, strategy, tools, skills = classify_and_decide()
```

### After Execution (in Build Mode)

```python
# Update confidence in intent_lookup.yaml
lookup = yaml.safe_load(".opencode/runtime/intent_lookup.yaml")
lookup["intents"][intent]["c"] = min(0.99, lookup["intents"][intent]["c"] + 0.05)

with open(".opencode/runtime/intent_lookup.yaml", "w") as f:
    yaml.dump(lookup, f)

# Clean up current intent file
intent_file.unlink()
```

## File Structure

```
.opencode/runtime/
├── intent_lookup.yaml       # Learned patterns (persists)
└── current_intent.yaml      # Temporary (deleted after build)
```

## Usage

```bash
# Plan mode
> plan to fix authentication bug
[Agent creates plan]
> confirm
Intent stored: debug→direct→[R,G,B]→code-agent

# Switch to build mode
> build
Using intent from plan: debug
[Executes with debug tools]
Confidence updated
```

## Benefits

1. **No lost context** - Intent survives plan→build handoff
2. **Self-learning** - Confirmed intents boost confidence
3. **Clean** - Temporary file deleted after use
4. **Backward compatible** - Works with existing intent_lookup.yaml
