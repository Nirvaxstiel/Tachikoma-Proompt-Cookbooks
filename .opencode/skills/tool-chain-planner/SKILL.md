# Skill: Tool Chain Planner

## Description

Enables Tachikoma to reduce LLM inference cycles by generating and executing multi-step tool chains via bash. Use this skill when planning predictable sequences of operations.

## When to Use

Use this skill when:
- You need to perform a sequence of predictable operations
- You want to reduce the number of inference cycles
- The operations are deterministic and don't need human decision points
- You can generate the full sequence of commands upfront

## Connection Table

This skill connects to:

| Context Module | Purpose |
|----------------|---------|
| `00-core-contract.md` | Foundational rules |
| `10-coding-standards.md` | Code patterns |

## Available Tools

Single source of truth for OpenCode tools:

| Tool | Description | Key Parameters |
|------|-------------|----------------|
| `bash` | Execute shell commands | `command`, `timeout`, `workdir` |
| `read` | Read file contents | `filePath`, `limit`, `offset` |
| `write` | Write/create files | `content`, `filePath` |
| `edit` | Edit existing files | `filePath`, `oldString`, `newString` |
| `glob` | Find files by pattern | `pattern`, `path` |
| `grep` | Search file contents | `pattern`, `include`, `path` |
| `task` | Spawn subagents | `command`, `description`, `subagent_type` |
| `webfetch` | Fetch web content | `url`, `format` |
| `websearch` | Search the web | `query`, `numResults` |
| `codesearch` | Search code APIs | `query`, `tokensNum` |
| `skill` | Load skills | `name` |
| `todowrite` | Manage todos | `todos`, `content`, `status`, `priority` |
| `question` | Ask user questions | `question`, `options` |
| `apply_patch` | Apply unified diffs | `patch`, `filePath` |
| `batch` | Batch tool calls | `tool_calls[]` (parallel, max 25) |

## Workflow

### Step 1: Plan the Chain

Analyze the task and determine:
1. What operations are needed
2. What's the dependency order
3. Can any operations run in parallel

### Step 2: Generate Chain Code

Generate bash code that executes the full chain. Use the patterns below.

### Step 3: Execute via Bash

Run the generated code via the `bash` tool.

### Step 4: Evaluate Results

Parse the output (look for `=== STEP NAME ===` markers) and decide next steps.

## Code Generation Patterns

### Quick One-Liners

**Sequential with &&** (stops on first failure):
```bash
find . -name "*.ts" | head -5 > /tmp/tsfiles && cat $(head -1 /tmp/tsfiles) | grep -n "TODO"
```

**Sequential with ;** (continues on failure):
```bash
find . -name "*.ts" > /tmp/f; cat /tmp/f; grep TODO $(head -1 /tmp/f)
```

**Pipe chain** (output → input):
```bash
find . -name "*.ts" -exec grep -l "TODO" {} \; | head -3 | xargs cat | head -100
```

### Pattern 1: Files → Read → Search

Goal: Find files, read first, search within it.

```bash
# === FIND FILES ===
FILES=$(find . -name "*.ts" -type f | grep -v node_modules | head -10)
echo "=== FILES ==="
echo "$FILES"

# === READ FIRST ===
FIRST=$(echo "$FILES" | head -1)
echo "=== READING $FIRST ==="
cat "$FIRST"

# === SEARCH IN FILES ===
echo "=== SEARCH: TODO ==="
grep -n "TODO" $FILES | head -20
```

### Pattern 2: Parallel Searches

Goal: Search for multiple patterns simultaneously.

```bash
# Run 3 searches in parallel
{ grep -rn "TODO" --include="*.ts" . | head -10; } &
{ grep -rn "FIXME" --include="*.ts" . | head -10; } &
{ grep -rn "import.*from" --include="*.ts" . | head -10; } &
wait
echo "=== DONE ==="
```

### Pattern 3: Output Chaining via Temp Files

Goal: Pass output from one step to next.

```bash
# Step 1: Find → temp file
find . -name "*.json" > /tmp/files.txt
echo "Found $(wc -l < /tmp/files.txt) files"

# Step 2: Read first
FIRST=$(head -1 /tmp/files.txt)
cat "$FIRST" > /tmp/content.txt

# Step 3: Search in content
grep -o '"[a-z_]*"' /tmp/content.txt | sort | uniq -c | sort -rn | head -10
```

### Pattern 4: TypeScript with Bun (Complex Logic)

For complex chains, generate a `.ts` script:

```typescript
// chain.ts
const files = (await Bun.spawn(["find", ".", "-name", "*.ts"])).stdout.toString()
  .split("\n").filter(Boolean).slice(0, 10)

const results = { files: files.length, first: null, matches: [] }

if (files[0]) {
  const content = await Bun.file(files[0]).text()
  results.first = { file: files[0], lines: content.split("\n").length }
  results.matches = content.match(/TODO/g) || []
}

console.log(JSON.stringify(results, null, 2))
```

Run with: `bun run chain.ts`

## Example: Full Chain

**Task**: Find all TODO comments in TypeScript files and show their context

**Generated Chain**:

```bash
#!/bin/bash
set -e

echo "=== Step 1: Find TypeScript files ==="
FILES=$(find . -name "*.ts" -type f | grep -v node_modules | head -20)
FILE_COUNT=$(echo "$FILES" | wc -l)
echo "Found $FILE_COUNT files"

echo ""
echo "=== Step 2: Search for TODOs ==="
for f in $FILES; do
  TODO_COUNT=$(grep -c "TODO" "$f" 2>/dev/null || echo 0)
  if [ "$TODO_COUNT" -gt 0 ]; then
    echo "--- $f ($TODO_COUNT TODOs) ---"
    grep -n "TODO" "$f" | head -3
  fi
done

echo ""
echo "=== Done ==="
```

## Anti-Patterns

Don't use this approach when:
- You need user interaction between steps
- Steps might fail and need different handling based on failure type
- You need to make decisions mid-chain based on outputs
- The operations have side effects that affect each other unexpectedly

## Tips

1. **Use temp files** for output chaining between steps
2. **Prefix outputs** with `=== STEP NAME ===` for easy parsing
3. **Set -e** to stop on first error, or remove for partial results
4. **Use bun** for TypeScript scripts - faster and better for complex logic
5. **Limit results** with `head`/`tail` to avoid massive outputs
