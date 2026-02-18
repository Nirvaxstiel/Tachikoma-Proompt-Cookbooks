# Skill Tracking Implementation Summary

## What We Did

We've implemented skill tracking using OpenCode's **existing built-in telemetry** - no additional infrastructure required.

## Changes Made

### 1. Enhanced Database Queries

**File:** `.opencode/tools/dashboard/tachikoma_dashboard/db.py`

**Improvements:**
- ✅ Switch from querying `message` table to `part` table (more direct access to tool invocations)
- ✅ Track invocation count per skill (how many times each skill was used)
- ✅ Capture first_loaded and last_used timestamps
- ✅ Extract skill names from tool state (more reliable than message parts)
- ✅ Add `get_skill_usage_stats()` for aggregated analytics

**Before:** Only tracked unique skills per session
**After:** Full usage metrics including invocations, duration, status

### 2. Enhanced Skill Model

**File:** `.opencode/tools/dashboard/tachikoma_dashboard/models.py`

```python
@dataclass
class Skill:
    """Represents a loaded skill with usage metrics."""
    name: str
    session_id: str
    time_loaded: int
    invocation_count: int = 1      # NEW: How many times invoked
    last_used: int | None = None    # NEW: Last invocation time
```

### 3. Created Skill Analytics Tool

**File:** `.opencode/tools/dashboard/skill_analytics.py`

A standalone CLI tool to analyze skill usage:

```bash
# Show all sessions with skills
python .opencode/tools/dashboard/skill_analytics.py

# Show skill usage statistics
python .opencode/tools/dashboard/skill_analytics.py --stats

# Show skills for a specific session
python .opencode/tools/dashboard/skill_analytics.py --session <session_id>
```

### 4. Documented Capabilities

**File:** `docs/telemetry/opencode-telemetry-capabilities.md`

Comprehensive documentation covering:
- ✅ What OpenCode's database provides
- ✅ What we can track with existing data
- ✅ What's missing (future enhancement opportunities)
- ✅ How to query skill invocations
- ✅ Implementation status and recommendations

**File:** `.opencode/tools/dashboard/README_SKILL_ANALYTICS.md`

User-facing documentation:
- ✅ Quick start guide
- ✅ What's tracked
- ✅ Example output
- ✅ Limitations
- ✅ Dashboard integration

## What We Can Track Now

### ✅ Basic Skill Metrics (Implemented)

| Metric | Source | Description |
|---------|---------|-------------|
| **Skill Name** | `part.data.tool` | Which skill was invoked |
| **Invocation Count** | Count of tool calls | How many times used |
| **Session Usage** | Join with `session` table | Which sessions used which skills |
| **First/Last Used** | `part.time_created` | Temporal usage patterns |
| **Duration** | `state.time.end - state.time.start` | Execution time per invocation |
| **Status** | `state.status` | Success/failure rates |
| **Aggregated Stats** | GROUP BY queries | Cross-session patterns |

### ❌ Advanced Metrics (Not Implemented)

These would require additional telemetry infrastructure:

1. **Skill Iterations** - Retry loops, verification attempts
2. **Edit Format Success** - Per-format tracking per model
3. **RLM Performance** - Chunking, accuracy metrics
4. **Intent Classification** - Confidence, correctness rates
5. **Token Usage per Skill** - Context cost per skill

## Example Usage

### View Skill Usage Statistics

```bash
$ python .opencode/tools/dashboard/skill_analytics.py --stats --limit 5

================================================================================
SKILL USAGE STATISTICS
================================================================================

1. code-agent
   Invocations:   45
   Sessions:      12
   Avg Duration:  2450.3ms
   Total Time:    110.3s
   Success Rate:  95.6%
   First Used:    2026-02-17 10:23
   Last Used:     2026-02-18 14:52

2. research-agent
   Invocations:   23
   Sessions:      8
   Avg Duration:  1870.1ms
   Total Time:    43.0s
   Success Rate:  87.0%
   First Used:    2026-02-17 11:45
   Last Used:     2026-02-18 09:12
```

### View Sessions with Skills

```bash
$ python .opencode/tools/dashboard/skill_analytics.py --limit 3

================================================================================
SESSIONS WITH SKILLS
================================================================================

1. Skill loading debugging
   ID: ses_390b42bb3ffeK0jRl5jIlUKV8D
   Updated: 2026-02-18 13:56
   Skills: 11 - code-agent, research-agent, analysis-agent, ...

2. WezTerm custom colors
   ID: ses_39437293fffeeDJdXWDvB5bZ0j
   Updated: 2026-02-17 21:28
   Skills: 1 - context7

3. WezTerm config refactor
   ID: ses_39b006632ffeitsHg7Qeog27S8
   Updated: 2026-02-16 14:26
   Skills: 1 - git-commit
```

## Database Queries

### Get Skills for a Session

```sql
SELECT p.data, p.time_created
FROM part p
JOIN message m ON p.message_id = m.id
WHERE m.session_id = ?
AND json_valid(p.data) = 1
AND json_extract(p.data, '$.type') = 'tool'
ORDER BY p.time_created ASC;
```

### Get Aggregated Skill Stats

```sql
SELECT
    s.directory,
    p.data,
    p.time_created
FROM part p
JOIN message m ON p.message_id = m.id
JOIN session s ON m.session_id = s.id
WHERE json_valid(p.data) = 1
AND json_extract(p.data, '$.type') = 'tool'
ORDER BY p.time_created DESC;
```

## Dashboard Integration

The Tachikoma dashboard will display skill information in the **Loaded Skills Panel**:

```
┌─────────────────────────────────────────────────────────┐
│ Loaded Skills                                      │
├─────────────────────────────────────────────────────────┤
│ Skill Name          | Invocations | Last Used       │
├─────────────────────────────────────────────────────────┤
│ code-agent          | 12          | 2026-02-18 14:52│
│ research-agent      | 5           | 2026-02-18 09:12│
│ formatter          | 8           | 2026-02-18 11:23│
└─────────────────────────────────────────────────────────┘
```

## Benefits

### ✅ No Additional Infrastructure

- Uses OpenCode's existing database
- No separate telemetry system needed
- No schema changes required
- Works out-of-the-box with OpenCode

### ✅ Rich Analytics

- Track skill usage patterns
- Identify popular/unused skills
- Monitor performance (duration, success rate)
- Analyze cross-session behavior

### ✅ Simple to Use

- Standalone CLI tool
- Clear, readable output
- Flexible filtering (by session, directory)
- Exportable data for further analysis

## Future Enhancements

If more granular metrics are needed, consider:

1. **Extend OpenCode Database** - Add migration tables for skill-specific metrics
2. **Separate Telemetry** - Use JSON-based logger for advanced metrics
3. **Hybrid Approach** - Combine both for maximum insight

See `docs/telemetry/opencode-telemetry-capabilities.md` for details.

## Files Changed

```
.opencode/tools/dashboard/tachikoma_dashboard/db.py
.opencode/tools/dashboard/tachikoma_dashboard/models.py
.opencode/tools/dashboard/skill_analytics.py          (NEW)
.opencode/tools/dashboard/README_SKILL_ANALYTICS.md  (NEW)
docs/telemetry/opencode-telemetry-capabilities.md    (NEW)
```

## Testing

All changes have been tested and verified:

```bash
# Test skill stats
python .opencode/tools/dashboard/skill_analytics.py --stats

# Test session listing
python .opencode/tools/dashboard/skill_analytics.py

# Verify data accuracy
# (Checked against actual OpenCode database)
```

## Conclusion

We now have **comprehensive skill tracking** using OpenCode's built-in telemetry. This provides valuable insights into:

- Which skills are used most frequently
- Which skills have performance issues
- Which skills are unused
- How skills are used across sessions

**No additional telemetry infrastructure required** - everything works with OpenCode's existing database.

---

**Status:** ✅ Complete and tested
**Date:** 2026-02-18
