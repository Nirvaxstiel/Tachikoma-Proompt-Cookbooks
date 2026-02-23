---
name: context7
description: Retrieve live documentation for libraries and frameworks via Context7 API. Used by Tachikoma during research intent to get current docs instead of stale training data.
version: 1.0.0
author: tachikoma
type: skill
category: research
tags:
  - documentation
  - api
  - external
  - research
---

# Context7 Skill

> **Purpose**: Live documentation fetcher. Tachikoma invokes this when research intent is detected to get current API docs instead of relying on outdated training data.

---

## How Tachikoma Uses This

When research intent is detected with high confidence:

```
User: "How do React Server Components work?"

Tachikoma (internal):
  Intent: research (confidence: 0.91)
  Context: Training data has React 18, user needs React 19
  Action: Fetch current documentation
  Command: bun run router.ts quick "React" "Server Components"
  Result: Current docs from React 19
  Output: Presented to user with source citation
```

**Why this matters**: Training data is often 6-24 months old. React 19, Next.js 15, and other frameworks change rapidly.

---

## Operations

1. **SEARCH** - Find library IDs by name
2. **FETCH** - Get documentation for specific topics
3. **QUICK** - Search + fetch in one command (used by Tachikoma)
4. **LIST** - Show cached documentation
5. **CLEANUP** - Remove old cached docs

---

## Live vs Training Data

| Source | Data Age | Accuracy |
|--------|----------|----------|
| Training data | 6-24 months | May be outdated |
| Context7 API | Real-time | Current |

**Use when:**
- Research intent detected (confidence > 0.8)
- Working with rapidly evolving frameworks
- Need current API signatures
- Verifying deprecated features

---

## Quick Start

```bash
# Search for a library
bash .opencode/skills/context7/router.sh search "React" "hooks"

# Fetch specific documentation
bash .opencode/skills/context7/router.sh fetch "/websites/react_dev_reference" "useState"

# Or do both in one command
bash .opencode/skills/context7/router.sh quick "FastAPI" "dependencies"
```

---

## How It Works

### Step 1: Search

Find the library ID:

```bash
bun run router.ts search "React" "hooks"
```

**Output:**
```
══════════════════════════════════════════════════════════
SEARCH: Finding Library
══════════════════════════════════════════════════════════

Library: React
Query: hooks

Searching Context7 API...

Top results:

  📚 React - Official React documentation
     ID: /websites/react_dev_reference
     Description: Official React documentation website
     Snippets: 2847

✓ Search complete

Next: Use 'fetch' with the library ID to get documentation
```

### Step 2: Fetch

Get documentation for a specific topic:

```bash
bun run router.ts fetch "/websites/react_dev_reference" "useState"
```

**Output:**
```
══════════════════════════════════════════════════════════
FETCH: Getting Documentation
══════════════════════════════════════════════════════════

Library ID: /websites/react_dev_reference
Topic: useState
Output: .tmp/external-context/_websites_react_dev_reference_useState.txt

Fetching from Context7...

✓ Documentation saved

File: .tmp/external-context/_websites_react_dev_reference_useState.txt
Size: 12K

Preview (first 20 lines):
---
useState

useState is a React Hook that lets you add state to functional components.

const [state, setState] = useState(initialState);

Parameters:
- initialState: The value you want the state to be initially...
---

Tip: Reference this file in your context or pass to subagents
```

### Step 3: Use in Context

```markdown
## External Context Fetched

- React useState hook: `.tmp/external-context/_websites_react_dev_reference_useState.txt`
```

---

## Common Libraries

| Library | Typical ID |
|---------|-----------|
| React | `/websites/react_dev_reference` |
| Next.js | `/vercel/next.js` |
| FastAPI | `/fastapi/fastapi` |
| Django | `/django/django` |
| Express | `/expressjs/express` |

*Use `search` to find the exact ID for your version.*

---

## Examples

### React Hooks

```bash
# Find React
bun run router.ts search "React" "hooks"

# Fetch useState docs
bun run router.ts fetch "/websites/react_dev_reference" "useState"

# Fetch useEffect docs
bun run router.ts fetch "/websites/react_dev_reference" "useEffect"
```

### Next.js App Router

```bash
# One-liner
bun run router.ts quick "Next.js" "app router"

# Or step by step
bun run router.ts search "Next.js" "routing"
bun run router.ts fetch "/vercel/next.js" "app router"
```

### FastAPI Dependencies

```bash
bun run router.ts quick "FastAPI" "dependency injection"
```

---

## Caching

Fetched documentation is cached in `.tmp/external-context/`:

```bash
# List cached docs
bun run router.ts list

# Clean up old docs (default: 7 days)
bun run router.ts cleanup 7
```

**Why cache?**
- Avoid re-fetching same docs
- Work offline with cached content
- Faster repeated queries

---

## Integration with Routing System

Tachikoma invokes Context7 during research intent processing:

```
User: "How do React Server Components work?"
    ↓
[Intent Classification]
    Intent: research (confidence: 0.91)
    Context modules: core-contract, research-methods
    ↓
[Action: Fetch Current Documentation]
    Detects: Training data = React 18, Current = React 19
    Command: bun run router.ts quick "React" "Server Components"
    Saves: .tmp/external-context/react_server_components.txt
    ↓
[Route to research-agent skill]
    Skill loads fetched docs as context
    Provides answer with current React 19 examples
```

### Routing Configuration

Add to `intent-routes.yaml` for automatic fetching:

```yaml
routes:
  research:
    description: Investigation and documentation lookup
    confidence_threshold: 0.7
    context_modules:
      - core-contract
      - research-methods
    skill: research-agent
    # Optional: Auto-fetch external docs
    tools:
      - Read
      - Bash  # For context7 router
```

### When Context7 is Invoked

1. **Research intent** (confidence > 0.8) - Fetch current API docs
2. **Implement intent** with new library - Verify current signatures
3. **Review intent** - Check for deprecated features
4. **User explicitly asks** "What are the current docs for X?"

---

## Requirements

- **curl** - Required for HTTP requests
- **jq** - Recommended for JSON formatting (optional)

---

## File Structure

```
.opencode/skills/context7/
├── SKILL.md              # This documentation
└── router.sh             # Bash router script
```

---

## Tips

1. **Use 'quick' for speed**: Combines search + fetch in one
2. **Cache frequently**: Keep commonly-used docs cached
3. **Be specific**: "useState" better than "React state"
4. **Check cache first**: Run 'list' before fetching
5. **Clean regularly**: Old docs may be outdated

---

## Limitations

- Requires internet connection
- Rate-limited (free tier)
- Not all libraries available
- Some docs may be incomplete

---

**Context7 Skill** - Current docs, current code! 📚
