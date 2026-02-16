---
name: intent-classifier
description: Classifies user queries into intents for the Tachikoma orchestrator. Returns structured classification with confidence scores.
version: 1.0.0
author: tachikoma
type: skill
category: orchestration
tags:
  - classification
  - routing
  - intent-detection
---

# Intent Classifier Skill

> **Purpose**: Analyze user queries and classify them into predefined intents with confidence scores.

---

## What I Do

I analyze user queries and return a structured classification that helps the orchestrator route tasks to the right specialist. I use pattern matching, keyword analysis, and semantic understanding to determine:

1. **Primary intent** - What is the user trying to do?
2. **Confidence level** - How certain am I about this classification?
3. **Reasoning** - Why did I choose this intent?
4. **Suggested action** - Should we use a skill, subagent, or ask for clarification?

---

## Supported Intents

| Intent | Description | Example Queries |
|--------|-------------|-----------------|
| **debug** | Finding and fixing issues | "fix the bug", "why is this broken", "error in production" |
| **implement** | Writing/modifying code | "add a feature", "create component", "implement auth" |
| **review** | Code analysis and auditing | "review this code", "analyze quality", "check for issues" |
| **research** | Investigation and information | "find docs", "research API", "understand how this works" |
| **git** | Version control operations | "commit changes", "create PR", "merge branch" |
| **document** | Documentation tasks | "update README", "write docs", "add comments" |
| **complex** | Large/multi-step tasks | "refactor entire codebase", "analyze all files", "bulk migration" |

---

## Classification Patterns

### Debug Patterns
- Keywords: `fix`, `bug`, `error`, `issue`, `troubleshoot`, `broken`, `not working`, `fails`, `crash`, `exception`
- Indicators: User mentions problems, errors, or broken functionality

### Implement Patterns
- Keywords: `add`, `create`, `build`, `write`, `implement`, `develop`, `code`, `make`, `generate`, `produce`
- Indicators: User wants to create something new or add functionality

### Review Patterns
- Keywords: `review`, `analyze`, `audit`, `check`, `inspect`, `evaluate`, `assess`, `critique`, `examine`
- Indicators: User wants evaluation or analysis without changes

### Research Patterns
- Keywords: `find`, `search`, `lookup`, `investigate`, `research`, `explore`, `discover`, `learn`, `understand`, `how to`, `what is`, `explain`
- Indicators: User seeks information or understanding

### Git Patterns
- Keywords: `commit`, `push`, `pull`, `merge`, `branch`, `pr`, `pull request`, `diff`, `status`, `log`, `revert`, `stash`
- Indicators: Version control operations

### Document Patterns
- Keywords: `document`, `doc`, `readme`, `explain`, `describe`, `tutorial`, `guide`, `wiki`
- Indicators: Creating or updating documentation

### Complex Patterns
- Keywords: `large`, `entire`, `whole`, `all files`, `bulk`, `refactor everything`, `migrate all`
- Indicators: Tasks that span many files or require significant processing

---

## Skill Chain Detection

Detect when multiple skills are needed:

### Multi-Verb Patterns (Need Sequential Chain)
- "research AND implement" → [research-agent, code-agent]
- "review AND fix" → [analysis-agent, code-agent]
- "research AND test" → [research-agent, code-agent, verifier-code-agent]

### High-Stakes Patterns (Need Verification Chain)
- "secure", "auth", "payment", "encryption" → [code-agent, verifier-code-agent]
- "critical", "production", "mission-critical" → [code-agent, verifier-code-agent, reflection-orchestrator]

### Multi-Perspective Patterns (Need Parallel Chain)
- "review thoroughly" → [analysis-agent (security), analysis-agent (performance)]
- "comprehensive analysis" → [analysis-agent, research-agent]

---

## Output Format

Return **JSON only** with this schema:

```json
{
  "intent": "debug|implement|review|research|git|document|complex|unclear",
  "confidence": 0.0-1.0,
  "reasoning": "Brief explanation of why this intent was chosen",
  "suggested_action": "skill|subagent|direct|ask|skill_chain",
  "keywords_matched": ["keyword1", "keyword2"],
  "alternative_intents": [
    {"intent": "other", "confidence": 0.3}
  ],
  "skill_chain": {
    "needed": true|false,
    "chain": ["skill1", "skill2", "skill3"],
    "mode": "sequential|parallel"
  },
  "confidence_routing": {
    "action": "proceed|verify|ask_user",
    "route_to": "skill_name|subagent_name|null",
    "reason": "Confidence 0.75 < 0.80 for complex task, adding verification",
    "difficulty": "simple|medium|complex|critical",
    "verification_needed": true|false
  }
}
```

### Field Descriptions

- **intent**: Primary classification
- **confidence**: Certainty level (0.0 = uncertain, 1.0 = certain)
- **reasoning**: Human-readable explanation
- **suggested_action**: Recommended execution strategy
  - `skill`: Load a skill and execute directly
  - `subagent`: Delegate to specialized subagent
  - `direct`: Handle without skill/agent (simple tasks)
  - `ask`: Need user clarification
- **keywords_matched**: Pattern keywords that triggered this classification
- **alternative_intents**: Other possible intents with lower confidence
- **confidence_routing**: ⭐ PHASE 2.2 - Confidence-based routing information
  - **action**: `proceed`, `verify`, or `ask_user`
  - **route_to**: Which skill/agent to route to (if action is `verify`)
  - **reason**: Explanation of routing decision
  - **difficulty**: Classified task difficulty (simple, medium, complex, critical)
  - **verification_needed**: Whether verification is required

---

## Confidence Guidelines

### High Confidence (> 0.8)
Clear intent with strong keyword matches:
- "fix the bug in authentication" → debug, confidence: 0.95
- "create a new React component" → implement, confidence: 0.9
- "analyze this code for security issues" → review, confidence: 0.88

### Medium Confidence (0.5 - 0.8)
Reasonable match but some ambiguity:
- "work on the user feature" → implement, confidence: 0.7 (could be research first)
- "check this code" → review, confidence: 0.65 (could be debug)

### Low Confidence (< 0.5)
Unclear or ambiguous:
- "do the thing" → unclear, confidence: 0.2
- "help me" → unclear, confidence: 0.15

---

## Classification Rules

### DO:

✅ **Match multiple patterns if needed**
```
Query: "research how to implement this feature"
→ Primary: implement (0.7)
→ Alternative: research (0.5)
→ Action: skill (implement, but may need research first)
```

✅ **Consider context size**
- If query mentions "entire codebase", "all files", "bulk" → boost confidence for "complex"
- If query is very short and vague → reduce confidence, suggest "ask"

✅ **Provide alternatives**
- Always include top 2-3 alternative intents with confidence scores
- Helps orchestrator make informed routing decisions

### DON'T:

❌ **Guess with low confidence**
- If confidence < 0.5, return "unclear" and suggest asking user

❌ **Over-classify**
- Don't force a classification when intent is genuinely ambiguous

❌ **Ignore negations**
- "don't fix this" → NOT debug, even though "fix" is present
- "no need to document" → NOT document

---

## Usage Example

### Input Query
```
"fix the authentication bug where users can't login"
```

### Classification Process

1. **Pattern matching:**
   - "fix" → debug pattern (strong match)
   - "bug" → debug pattern (strong match)
   - "authentication" → context (not intent-specific)
   - "can't login" → problem description

2. **Intent determination:**
   - Primary: debug (multiple strong matches)
   - Confidence: 0.95 (very clear intent)

3. **Action selection:**
   - This is a coding task → suggest "skill"
   - Specific enough for direct execution

### Output
```json
{
  "intent": "debug",
  "confidence": 0.95,
  "reasoning": "Query contains strong debug indicators: 'fix', 'bug', and describes a specific problem (users can't login)",
  "suggested_action": "skill",
  "keywords_matched": ["fix", "bug", "can't"],
  "alternative_intents": [
    {"intent": "research", "confidence": 0.2}
  ]
}
```

---

## Edge Cases

### Ambiguous Queries

**Query**: "work on the user module"

**Analysis**:
- "work on" is vague (could be implement, debug, or review)
- "user module" provides context but not intent

**Output**:
```json
{
  "intent": "unclear",
  "confidence": 0.4,
  "reasoning": "Query is too vague. 'work on' could mean implement, debug, or review.",
  "suggested_action": "ask",
  "keywords_matched": [],
  "alternative_intents": [
    {"intent": "implement", "confidence": 0.35},
    {"intent": "debug", "confidence": 0.25},
    {"intent": "review", "confidence": 0.2}
  ]
}
```

### Composite Queries

**Query**: "research the best auth library then implement it"

**Analysis**:
- "research" → research pattern
- "implement" → implement pattern
- This is a two-phase task

**Output**:
```json
{
  "intent": "implement",
  "confidence": 0.8,
  "reasoning": "User wants to implement auth after research. Primary goal is implementation.",
  "suggested_action": "skill",
  "keywords_matched": ["research", "implement"],
  "alternative_intents": [
    {"intent": "research", "confidence": 0.6}
  ]
}
```

### Negations

**Query**: "don't fix this yet, just analyze it"

**Analysis**:
- "don't fix" → negate debug intent
- "analyze" → review pattern

**Output**:
```json
{
  "intent": "review",
  "confidence": 0.9,
  "reasoning": "User explicitly said not to fix, wants analysis only.",
  "suggested_action": "skill",
  "keywords_matched": ["analyze"],
  "alternative_intents": [
    {"intent": "debug", "confidence": 0.1}
  ]
}
```

---

## Integration with Orchestrator

The orchestrator (tachikoma) uses this skill by:

1. Loading this SKILL.md file
2. Passing the user query to the classification logic
3. Receiving structured JSON output
4. Using the output to:
   - Load appropriate context modules
   - Route to appropriate skill or subagent
   - Decide whether to ask user for clarification

---

## Notes

- This skill uses fast pattern matching - no I/O operations needed
- Pure reasoning based on query text and patterns

---

**Intent Classifier Skill** - Fast, reliable intent detection for intelligent routing!
