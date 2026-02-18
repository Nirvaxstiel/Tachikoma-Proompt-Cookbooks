# OpenCode Telemetry for Tachikoma Skills

## Overview

OpenCode provides built-in telemetry through its SQLite database at `~/.local/share/opencode/opencode.db`. This document describes what's available for tracking skill usage and how Tachikoma can leverage it.

## What OpenCode Provides ✅

### Database Schema

OpenCode's database includes these relevant tables:

```sql
session     -- Session metadata (id, title, directory, timestamps)
message     -- Messages with role, tokens, cost, model, provider
part         -- Tool invocations with detailed state (input, output, status)
todo         -- Task tracking
```

### Tool Invocation Data

The `part` table tracks detailed tool invocations with:

```json
{
  "type": "tool",
  "callID": "  functions.skill:42",
  "tool": "skill",
  "state": {
    "status": "completed",      // running | completed | failed
    "input": {
      "name": "code-agent",     // skill name
      "description": "..."
    },
    "output": "Result data...",
    "title": "Load code-agent skill",
    "time": {
      "start": 1770044877509,
      "end": 1770044880083
    }
  }
}
```

### Built-in Analytics

`opencode stats` command provides:
- **Tool usage** - Frequency of each tool (including `skill`)
- **Model usage** - Tokens, costs per model
- **Session statistics** - Messages, tokens per session, median, cost per day

## Skill Tracking with Existing Data

### What We Can Track Now

Using tool invocations from the `part` table, we can track:

1. **Which skills were used** - Parse `tool` field for "skill" or skill-specific names
2. **When skills were loaded** - Use `time.start` from tool state
3. **How many times** - Count tool invocations per skill
4. **Skill duration** - Calculate from `time.end - time.start`
5. **Skill status** - Track success/failure from `state.status`
6. **Per-session skill usage** - Join with session table

### Query Examples

```sql
-- Get all skill invocations in a session
SELECT p.data, p.time_created
FROM part p
JOIN message m ON p.message_id = m.id
WHERE m.session_id = ?
AND json_valid(p.data) = 1
AND json_extract(p.data, '$.tool') = 'skill'
ORDER BY p.time_created DESC;

-- Count skill usage frequency
SELECT json_extract(p.data, '$.state.input.name') as skill_name,
       COUNT(*) as invocation_count
FROM part p
JOIN message m ON p.message_id = m.id
WHERE json_valid(p.data) = 1
AND json_extract(p.data, '$.tool') = 'skill'
GROUP BY skill_name
ORDER BY invocation_count DESC;
```

### Dashboard Integration

Our Tachikoma dashboard already queries OpenCode's database:

```python
# .opencode/tools/dashboard/tachikoma_dashboard/db.py
def get_session_skills(session_id: str) -> list[Skill]:
    """Get skills loaded in a session by parsing tool calls from messages."""
    # Queries part table for skill invocations
    # Returns: skill_name, session_id, time_loaded
```

This provides **skill tracking without extra infrastructure**.

## Gaps: What OpenCode Doesn't Track ❌

OpenCode's telemetry lacks skill-specific metrics that would be useful for optimization:

### 1. Skill Invocation Metrics
**Missing:** Detailed performance tracking per skill

| Metric | Description | Use Case |
|---------|-------------|-----------|
| Tokens used | Context cost per skill | Optimize skill instructions |
| Duration | Time to complete tasks | Identify slow skills |
| Success rate | Tasks completed vs failed | Improve skill reliability |
| Iterations | Retry loops, verification attempts | Reduce redundant work |

**Current approach:** Can infer from tool state (start/end times, status) but lacks granular metrics.

### 2. Skill Iterations
**Missing:** Tracking retry loops and verification attempts

| Iteration Data | Description | Use Case |
|---------------|-------------|-----------|
| Retry count | How many times skill retried | Identify flaky skills |
| Verification loops | GVR pattern attempts | Optimize verification criteria |
| Max iterations reached | Escalation events | Improve error handling |

**Current approach:** Can track tool invocations but not iteration relationships within a skill.

### 3. Edit Format Success Rates
**Missing:** Per-format tracking per model

| Metric | Description | Use Case |
|---------|-------------|-----------|
| Format success | Which formats work for which models | Optimize edit strategies |
| Attempts per edit | Retry loops per edit | Reduce wasted tokens |
| Format vs model matrix | Success rate by (model, format) pair | Choose best format per model |

**Current approach:** Tool invocations track edits but not format-specific success rates.

### 4. RLM (Recursive Language Model) Performance
**Missing:** Chunking and processing metrics

| RLM Metric | Description | Use Case |
|------------|-------------|-----------|
| Chunk count | How many chunks processed | Optimize chunk size |
| Processing time | Time per chunk | Identify bottlenecks |
| Parallel vs sequential | Execution mode comparison | Optimize throughput |
| Accuracy | Result correctness | Improve quality |
| Token efficiency | Tokens per chunk | Reduce cost |

**Current approach:** Tool state tracks start/end times but not chunk-level metrics.

### 5. Intent Classification
**Missing:** Classification accuracy and confidence

| Intent Metric | Description | Use Case |
|--------------|-------------|-----------|
| Confidence score | Model's certainty | Identify uncertain classifications |
| Actual correctness | Was classification right? | Improve routing |
| Escalation rate | Tasks escalated to human | Adjust thresholds |
| Confusion matrix | Which intents get confused | Disambiguate routing |

**Current approach:** No intent tracking at all in database.

## Current Capabilities

### What Works Today

✅ **Skill Discovery**
- Parse tool invocations for `skill` or skill-specific tool names
- Extract skill names from `input.name` arguments

✅ **Usage Statistics**
- Count how many times each skill is invoked
- Track skill usage per session

✅ **Temporal Tracking**
- When skills were loaded (`time.start`)
- How long skills took to execute (`time.end - time.start`)
- Skill usage over time

✅ **Status Tracking**
- Running vs completed vs failed
- Success/failure rates from tool state

✅ **Session Context**
- Which sessions used which skills
- Skill usage patterns across projects

### What Requires Enhancement

❌ **Granular Performance Metrics**
- Need dedicated tracking for tokens, duration, success rate
- Requires additional infrastructure (telemetry logger or DB extension)

❌ **Skill-Specific Metrics**
- Verification loops, retry counts, GVR patterns
- Requires skill-level instrumentation

❌ **Cross-Session Analytics**
- Skill improvement over time
- Pattern recognition across sessions
- Requires aggregation layer

## Implementation Status

### ✅ Implemented (Current)

1. **Dashboard skill tracking**
   - File: `.opencode/tools/dashboard/tachikoma_dashboard/db.py`
   - Function: `get_session_skills(session_id)`
   - Parses tool invocations from `part` table

2. **Built-in OpenCode stats**
   - Command: `opencode stats`
   - Provides: tool usage, model usage, session stats

3. **Tool invocation queries**
   - File: `.opencode/tools/dashboard/tachikoma_dashboard/query.py`
   - Type-safe query builder for SQLite
   - Supports JSON extraction from `data` columns

### 🔄 Future Enhancements (Not Implemented)

1. **Skill metrics extension** - Add dedicated telemetry tables
2. **Edit format tracking** - Per-format success rates per model
3. **RLM performance metrics** - Chunking, accuracy, throughput
4. **Intent classification tracking** - Confidence, correctness, escalation
5. **Telemetry dashboard panel** - Visualize skill-specific metrics

## Recommendations

### Phase 1: Leverage Existing Data (Current)

1. **Enhance dashboard skill panel**
   - Show skill invocation count per session
   - Display skill duration (from tool state)
   - Track success/failure rate from tool status

2. **Add skill usage analytics**
   - Aggregate skill usage across sessions
   - Show most-used skills
   - Identify unused skills

3. **Improve skill tracking queries**
   - Extract more metadata from tool state
   - Parse skill-specific input/output
   - Track skill execution patterns

### Phase 2: Add Dedicated Telemetry (Future)

**Option A: Extend OpenCode Database**
- Add migration tables: `skill_metrics`, `edit_metrics`, `rlm_metrics`, `intent_metrics`
- Integrate with OpenCode's infrastructure
- Single source of truth

**Option B: Separate Telemetry System**
- Keep JSON-based telemetry logger (`.opencode/core/telemetry-logger.py`)
- Store in `.opencode/telemetry/metrics.json`
- Portable, no DB changes needed

**Option C: Hybrid Approach**
- Use OpenCode DB for basic tracking (already done)
- Add separate telemetry for advanced metrics
- Combine in dashboard for unified view

## Conclusion

OpenCode provides **adequate tracking for basic skill usage** through its tool invocation system. We can leverage this to:

- ✅ Track which skills are used
- ✅ Measure usage frequency
- ✅ Calculate execution duration
- ✅ Monitor success/failure status

For **advanced skill metrics** (iterations, edit formats, RLM, intent), we need additional telemetry infrastructure. This is a **future enhancement** to consider when the basic tracking proves insufficient.

**Current stance:** Use OpenCode's existing telemetry. It's already useful enough for our needs.

## References

- OpenCode Database Schema: `temp-docs/opencode/packages/opencode/migration/`
- Dashboard Implementation: `.opencode/tools/dashboard/tachikoma_dashboard/`
- OpenCode Stats Command: `temp-docs/opencode/packages/opencode/src/cli/cmd/stats.ts`
- Telemetry Logger (Future): `.opencode/core/telemetry-logger.py`
