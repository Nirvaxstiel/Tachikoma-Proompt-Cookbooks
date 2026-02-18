# Communication Protocol

Structured communication patterns for agent coordination and user interaction.

## What & Why

**Problem:** Agents need to communicate with each other and users in consistent, predictable ways. Without structured protocols:

- Unclear what information is needed
- Inconsistent message formats
- Uncertainty about who is responsible
- Difficult to parse and route messages

**Solution:** **Communication protocol** defines standardized message formats, reporting requirements, and interaction patterns.

## Between Agents

### Message Format

All agent-to-agent communication follows this structure:

```yaml
This task must be performed by subagent "{agent_name}".

CONTEXT LOADED:
- {list of loaded context modules}

USER REQUEST:
{user_query}

CLASSIFICATION:
- Intent: {intent}
- Confidence: {confidence}
- Reasoning: {reasoning}

Execute this task following the loaded context and return a summary of actions taken.
```

### Guidelines

**Message Characteristics:**

- **Concise**: Keep under 500 tokens when possible
- **Structured**: Use defined sections (CONTEXT, USER REQUEST, CLASSIFICATION)
- **Complete**: Include all necessary information
- **Explicit**: State expectations clearly

**Example Messages:**

**Code Review:**

```yaml
This task must be performed by subagent "analysis-agent".

CONTEXT LOADED:
- 10-coding-standards
- 12-commenting-rules
- 00-core-contract

USER REQUEST:
Review the authentication implementation for security issues

CLASSIFICATION:
- Intent: review
- Confidence: 0.85
- Reasoning: Security-focused code review, user mentioned "security issues"

Execute this task following the loaded context and return a summary of actions taken.
```

**Complex Task:**

```yaml
This task must be performed by subagent "rlm-optimized".

CONTEXT LOADED:
- 10-coding-standards
- 00-core-contract

USER REQUEST:
Refactor the entire codebase for performance

CLASSIFICATION:
- Intent: complex
- Confidence: 0.92
- Reasoning: "entire codebase" indicates large task, "refactor" is known pattern

Execute this task following the loaded context and return a summary of actions taken.
```

## To User

### Report Always

Tachikoma always reports this information to users:

#### 1. Confidence Levels

For all classifications and important claims:

```
Intent: review (confidence: 85%)
Route: analysis-agent
Reasoning: Security-focused code review requested
```

#### 2. Routing Decisions

Always explain why a particular route was chosen:

```
✅ Task routed and executed

Intent: review (confidence: 85%)
Route: analysis-agent skill
Context modules loaded: coding-standards, commenting-rules

Summary:
- Reviewed authentication module for security
- Identified 2 potential vulnerabilities
- Provided remediation suggestions

Files changed: src/auth/validator.py
Next steps: Fix vulnerabilities, re-run security scan
```

#### 3. Files Changed

Always list files that were modified:

```
Files changed:
- .opencode/skills/code-agent/SKILL.md
- src/features/authentication.py
- tests/auth/security_test.py
```

#### 4. Actionable Next Steps

Provide clear next actions:

```
Next steps:
1. Review identified vulnerabilities
2. Apply security fixes
3. Re-run security verification
4. Update documentation
```

## Response Format

### Standard User Response

```markdown
✅ Task completed

**Task**: {what was requested}

**Summary**:
- {2-5 bullet points of what was done}

**Files changed**:
- {list of files modified}

**Next steps**:
- {actionable recommendations}
```

### Example Responses

**Code Implementation:**

```markdown
✅ Code Implementation Complete

**Task**: Add user authentication system

**Summary**:
- Created authentication module in src/auth/
- Implemented login endpoint at /api/auth/login
- Added JWT token management
- Integrated with existing user database

**Files changed**:
- src/auth/__init__.py
- src/auth/login.py
- src/auth/jwt_manager.py
- src/users/repository.py
- tests/auth/test_login.py
- requirements.txt (added pyjwt, bcrypt)

**Next steps**:
- Test authentication flow end-to-end
- Add logout functionality
- Document API endpoints
- Deploy to staging environment
```

**Code Review:**

```markdown
✅ Code Review Complete

**Task**: Review authentication for security issues

**Summary**:
- Analyzed authentication module (3 files, 450 LOC)
- Identified 2 potential vulnerabilities:
  1. Hardcoded JWT secret in production config
  2. SQL injection risk in user lookup
- Provided 3 remediation suggestions
- Verified compliance with security standards

**Files changed**:
- docs/security-findings.md (created)
- .opencode/context-modules/50-prompt-safety.md (updated)

**Next steps**:
- Fix JWT secret (use environment variable)
- Implement parameterized queries
- Re-run security audit after fixes
```

## Error Handling

### Communication on Failures

When a task fails, communicate clearly:

```markdown
❌ Task Failed

**Task**: {what was attempted}

**Error**: {what went wrong}

**Suggested Resolution**:
- {how to fix the issue}

**Context**: {what was being worked on}
```

**Example:**

```markdown
❌ Task Failed

**Task**: Generate API documentation

**Error**: Unable to parse OpenAPI specification
- File: api-spec.yaml
- Error: Invalid YAML syntax at line 127

**Suggested Resolution**:
1. Fix YAML syntax error
2. Re-run documentation generation

**Context**: Attempting to document REST API endpoints for user dashboard
```

## Interaction Patterns

### User Clarification

When user request is ambiguous:

```markdown
I need to clarify your request

**Detected possible intents**:
1. [Intent 1] - {description}
2. [Intent 2] - {description}
3. [Intent 3] - {description}

**Which best describes what you're trying to do?**

Or please rephrase with more detail.
```

**Example:**

```markdown
I need to clarify your request

**Detected possible intents**:
1. Review the authentication system
2. Fix a bug in authentication
3. Implement new authentication features
4. Refactor authentication code

**Which best describes what you're trying to do?**

Or please rephrase with more detail.
```

### Progress Updates

For long-running tasks, provide periodic updates:

```markdown
**Progress Update** - Step 1/3

**Current Task**: {what's being done}

**Status**: {in_progress, completed, failed}

**Details**:
- {what has been accomplished}
- {what remains to be done}

**Estimated time remaining**: {if available}
```

## Best Practices

### DO ✅

1. **Always Report Confidence**
   - Every classification includes confidence level
   - Every claim includes epistemic label
   - Users know certainty of decisions

2. **Be Transparent**
   - Explain routing decisions
   - Report what was done
   - Explain what couldn't be done

3. **Keep Messages Concise**
   - Agent-to-agent messages < 500 tokens
   - Avoid unnecessary fluff
   - Use structured sections

4. **Provide Actionable Next Steps**
   - Specific actions user should take
   - Clear priority of next steps
   - Estimated effort when available

### DON'T ❌

1. **Don't Hide Uncertainty**
   - Always state confidence levels
   - Don't present speculation as fact
   - Don't proceed when confidence is unknown

2. **Don't Skip Reporting**
   - Always report files changed
   - Always report what was done
   - Don't skip next steps

3. **Don't Use Jargon Excessively**
   - Keep language clear and accessible
   - Explain technical terms when necessary
   - Don't assume user knowledge

4. **Don't Over-Communicate**
   - One response per task unless requested
   - Group related updates
   - Wait for user input before proceeding

## Tools & Skills

### Skills That Apply Protocol

All skills follow communication protocol:

- **intent-classifier** - Reports classification with confidence
- **code-agent** - Reports what was done and files changed
- **analysis-agent** - Reports review findings and recommendations
- **research-agent** - Reports investigation results
- All subagents - Report task completion with summary

### Agent Handoffs

**From Tachikoma to Subagents:**

- Use structured message format
- Include context, query, classification
- Request summary of actions taken

**From Subagents to Tachikoma:**

- Return structured summary
- Include actions taken
- Report any issues encountered
- Suggest next steps if appropriate

## Related Tribal Rules

Communication protocol works with other tribal rules:

1. **Epistemic Mode** - Confidence labeling for all claims
2. **Validation** - Inspect before acting, communicate findings
3. **Stop Conditions** - Know when to stop and report
4. **Minimal Change** - Report exactly what was changed

## See Also

- [Universal Tribal Rules](#universal-tribal-rules) - All 9 tribal rules
- [Epistemic Mode](#epistemic-mode) - Confidence labeling
- [Context Management](./context-management.md) - How context modules work
- [Intent Routing](#intent-routing) - How classification informs communication

## Message Templates

### Success Response

```markdown
✅ {task_type} completed

**Summary**:
{bullet points of what was done}

**Files changed**:
{files modified}

**Next steps**:
{recommendations}
```

### Partial Success

```markdown
⚠️ {task_type} completed with warnings

**Summary**:
{what was accomplished}

**Warnings**:
{issues encountered}

**Files changed**:
{files modified}

**Next steps**:
{recommendations}
```

### Failure Response

```markdown
❌ {task_type} failed

**Error**: {what went wrong}

**Details**:
{additional context}

**Suggested Resolution**:
{how to fix}

**Context**:
{what was being worked on}
```
