---
title: Database Schema
description: What OpenCode tracks and where - SQLite tables, fields, and relationships.
---

# Database Schema

## Location

```
~/.local/share/opencode/opencode.db
```

SQLite database with Drizzle ORM.

## Tables Overview

| Table | Purpose |
|-------|---------|
| `project` | Workspace metadata |
| `session` | Conversation container |
| `message` | Single turn in conversation |
| `part` | Message component (text, tool call, file) |
| `todo` | Task tracking |
| `permission` | Project-level permissions |
| `session_share` | Shared sessions |
| `control_account` | Enterprise accounts |

## Project Table

```typescript
// packages/opencode/src/project/project.sql.ts
ProjectTable = sqliteTable("project", {
  id: text().primaryKey(),
  worktree: text().notNull(),        // Git worktree path
  vcs: text(),                       // VCS type (git, etc.)
  name: text(),                      // Display name
  icon_url: text(),                  // Project icon
  icon_color: text(),                // Icon color
  created_at: integer(),
  updated_at: integer(),
  time_initialized: integer(),       // When project was opened
  sandboxes: text({ mode: "json" }), // Sandbox directories
  commands: text({ mode: "json" }),  // Start commands
})
```

## Session Table

```typescript
// packages/opencode/src/session/session.sql.ts
SessionTable = sqliteTable("session", {
  id: text().primaryKey(),
  project_id: text().notNull().references(() => ProjectTable.id),
  parent_id: text(),                 // For session forking
  slug: text().notNull(),            // URL-friendly identifier
  directory: text().notNull(),       // Working directory
  title: text().notNull(),           // Session title
  version: text().notNull(),         // Schema version
  share_url: text(),                 // Public share URL
  summary_additions: integer(),      // Lines added
  summary_deletions: integer(),      // Lines deleted
  summary_files: integer(),          // Files changed
  summary_diffs: text({ mode: "json" }), // File diffs
  revert: text({ mode: "json" }),    // Undo state
  permission: text({ mode: "json" }), // Session permissions
  created_at: integer(),
  updated_at: integer(),
  time_compacting: integer(),        // Last compaction time
  time_archived: integer(),          // Archive timestamp
})
```

**Indexes:**
- `session_project_idx` on `project_id`
- `session_parent_idx` on `parent_id`

## Message Table

```typescript
MessageTable = sqliteTable("message", {
  id: text().primaryKey(),
  session_id: text().notNull().references(() => SessionTable.id),
  created_at: integer(),
  updated_at: integer(),
  data: text({ mode: "json" }).notNull(), // MessageV2.Info
})
```

**Indexes:**
- `message_session_idx` on `session_id`

## Part Table

The core unit - every message consists of parts.

```typescript
PartTable = sqliteTable("part", {
  id: text().primaryKey(),
  message_id: text().notNull().references(() => MessageTable.id),
  session_id: text().notNull(),
  created_at: integer(),
  updated_at: integer(),
  data: text({ mode: "json" }).notNull(), // MessageV2.Part
})
```

**Indexes:**
- `part_message_idx` on `message_id`
- `part_session_idx` on `session_id`

### Part Types

```typescript
type Part = 
  | TextPart        // User/assistant text
  | ToolCallPart    // Tool invocation
  | ToolResultPart  // Tool output
  | FilePart        // File attachment
  | ImagePart       // Image attachment
  | ThinkingPart    // Reasoning trace
```

## Todo Table

```typescript
TodoTable = sqliteTable("todo", {
  session_id: text().notNull().references(() => SessionTable.id),
  content: text().notNull(),         // Task description
  status: text().notNull(),          // pending | in_progress | completed | cancelled
  priority: text().notNull(),        // high | medium | low
  position: integer().notNull(),     // Order in list
  created_at: integer(),
  updated_at: integer(),
})
```

**Primary Key:** `(session_id, position)`

## Permission Table

```typescript
PermissionTable = sqliteTable("permission", {
  project_id: text().primaryKey().references(() => ProjectTable.id),
  created_at: integer(),
  updated_at: integer(),
  data: text({ mode: "json" }).notNull(), // PermissionNext.Ruleset
})
```

## Relationships

```
Project 1──* Session
Session 1──* Message
Message 1──* Part
Session 1──* Todo
Project 1──1 Permission
Session *──1 Session (parent/child forking)
```

## Querying

### Get all sessions for a project
```sql
SELECT * FROM session WHERE project_id = ? ORDER BY updated_at DESC
```

### Get all parts for a session
```sql
SELECT p.* FROM part p
JOIN message m ON p.message_id = m.id
WHERE m.session_id = ?
ORDER BY m.created_at, p.created_at
```

### Get tool calls in a session
```sql
SELECT p.data->>'$.tool' as tool, COUNT(*) as count
FROM part p
JOIN message m ON p.message_id = m.id
WHERE m.session_id = ? AND p.data->>'$.type' = 'tool_call'
GROUP BY p.data->>'$.tool'
```

## Telemetry Queries

### Skill usage tracking
```sql
SELECT 
  json_extract(data, '$.tool') as skill_name,
  COUNT(*) as invocations
FROM part
WHERE data->>'$.type' = 'tool_call'
  AND data->>'$.tool' = 'skill'
GROUP BY json_extract(data, '$.args.name')
```

### Session duration
```sql
SELECT 
  session_id,
  (MAX(created_at) - MIN(created_at)) as duration_ms
FROM message
GROUP BY session_id
```

## Migrations

Migrations are generated by Drizzle Kit:

```bash
bun run db generate --name <slug>
```

Output: `migration/<timestamp>_<slug>/migration.sql`

## Schema Source

All schema definitions are in `packages/opencode/src/**/*.sql.ts` files:

- `session/session.sql.ts` - Session, Message, Part, Todo, Permission
- `project/project.sql.ts` - Project
- `share/share.sql.ts` - SessionShare
- `control/control.sql.ts` - ControlAccount
