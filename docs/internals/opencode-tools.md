---
title: Tools System
description: How OpenCode tools work - registration, execution, and permissions.
---

# Tools System

Tools are atomic operations the agent can perform. Each tool is a TypeScript module with Zod-validated parameters.

## Tool Registry

Location: `packages/opencode/src/tool/registry.ts`

```typescript
// Built-in tools
const tools = [
  InvalidTool,      // Error handling
  QuestionTool,     // Ask user questions
  BashTool,         // Execute shell commands
  ReadTool,         // Read files
  GlobTool,         // Find files by pattern
  GrepTool,         // Search file contents
  EditTool,         // Edit files
  WriteTool,        // Write files
  TaskTool,         // Spawn subagents
  WebFetchTool,     // Fetch URLs
  TodoWriteTool,    // Manage todos
  WebSearchTool,    // Search the web
  CodeSearchTool,   // Search code APIs
  SkillTool,        // Load skills
  ApplyPatchTool,   // Apply patches (GPT models)
  LspTool,          // LSP operations (experimental)
  BatchTool,        // Batch operations (experimental)
  PlanEnterTool,    // Enter plan mode
  PlanExitTool,     // Exit plan mode
]
```

## Tool Definition

```typescript
// packages/opencode/src/tool/tool.ts
namespace Tool {
  interface Info<Parameters extends z.ZodType = z.ZodType, M extends Metadata = Metadata> {
    id: string
    init: (ctx?: InitContext) => Promise<{
      description: string
      parameters: Parameters
      execute(args: z.infer<Parameters>, ctx: Context): Promise<{
        title: string
        metadata: M
        output: string
        attachments?: FilePart[]
      }>
      formatValidationError?(error: z.ZodError): string
    }>
  }
}
```

## Tool Context

```typescript
type Context = {
  sessionID: string
  messageID: string
  agent: string
  abort: AbortSignal
  callID?: string
  extra?: { [key: string]: any }
  messages: MessageV2.WithParts[]
  metadata(input: { title?: string; metadata?: M }): void
  ask(input: PermissionNext.Request): Promise<void>
}
```

## Creating a Custom Tool

### 1. Create the tool file

`.opencode/tool/my-tool.ts`:

```typescript
import { Tool } from "@opencode-ai/plugin"
import z from "zod"

export default Tool.define("my-tool", {
  description: "Does something useful",
  parameters: z.object({
    input: z.string().describe("The input to process"),
  }),
  execute: async (args, ctx) => {
    // Your implementation
    return {
      title: "Processed",
      metadata: {},
      output: `Result: ${args.input}`,
    }
  },
})
```

### 2. Tool is auto-discovered

Tools in `.opencode/tool/` or `.opencode/tools/` are automatically loaded.

## Tool Files

| File | Tool | Purpose |
|------|------|---------|
| `bash.ts` | BashTool | Execute shell commands |
| `read.ts` | ReadTool | Read file contents |
| `write.ts` | WriteTool | Write/create files |
| `edit.ts` | EditTool | Edit existing files |
| `glob.ts` | GlobTool | Find files by pattern |
| `grep.ts` | GrepTool | Search file contents |
| `task.ts` | TaskTool | Spawn subagents |
| `webfetch.ts` | WebFetchTool | Fetch web content |
| `websearch.ts` | WebSearchTool | Search the web |
| `codesearch.ts` | CodeSearchTool | Search code APIs |
| `skill.ts` | SkillTool | Load skills |
| `todo.ts` | TodoWriteTool | Manage todos |
| `question.ts` | QuestionTool | Ask user questions |
| `apply_patch.ts` | ApplyPatchTool | Apply unified diffs |
| `lsp.ts` | LspTool | LSP operations |
| `batch.ts` | BatchTool | Batch tool calls |
| `plan.ts` | PlanEnterTool/PlanExitTool | Plan mode |

## Permission System

Tools check permissions before execution:

```typescript
// Permission actions
type Action = "ask" | "allow" | "deny"

// Permission rules
type Rule = Action | Record<string, Rule>

// Example config
{
  "permission": {
    "bash": "ask",           // Ask before bash
    "edit": {
      "*.env": "deny",       // Never edit .env files
      "*": "allow"           // Allow everything else
    },
    "read": {
      "*.env": "ask",        // Ask before reading .env
      "*": "allow"
    }
  }
}
```

## Output Truncation

Large outputs are automatically truncated:

```typescript
// packages/opencode/src/tool/truncation.ts
namespace Truncate {
  // Truncates output to fit context window
  // Writes full output to temp file
  // Returns truncated content + file path
}
```

## Model-Specific Tool Selection

Some tools are enabled/disabled based on model:

```typescript
// GPT models use apply_patch instead of edit/write
const usePatch = model.modelID.includes("gpt-") 
  && !model.modelID.includes("oss") 
  && !model.modelID.includes("gpt-4")

if (t.id === "apply_patch") return usePatch
if (t.id === "edit" || t.id === "write") return !usePatch
```

## Plugin Tools

Plugins can register tools:

```typescript
// In plugin
export const tool = {
  myCustomTool: {
    args: { input: z.string() },
    description: "Custom tool",
    execute: async (args, ctx) => "result"
  }
}
```

## Tool Execution Flow

```
1. Agent generates tool call
2. Permission check (ask/allow/deny)
3. If "ask", prompt user
4. If "deny", return error
5. If "allow", execute tool
6. Truncate output if needed
7. Store result in PartTable
8. Return to agent
```
