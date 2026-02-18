---
module_id: prompt-safety
name: Prompt Engineering Safety & Compliance
version: 2.1.0
description: Prompt engineering best practices, safety frameworks, and bias mitigation.
priority: 50
type: context
depends_on:
  - core-contract
exports:
  - prompt_engineering_patterns
  - safety_checklists
  - bias_mitigation_strategies
---

# Prompt Engineering Safety & Compliance

**Core Philosophy:** Safety first. Every prompt must pass safety evaluation before execution.

---

## Prompt Patterns (Quick Reference)

| Pattern | Use When | Example |
|---------|----------|---------|
| **Zero-Shot** | Simple, well-understood tasks | `Convert 25°C to Fahrenheit` |
| **Few-Shot** | Complex or domain-specific tasks | Provide 2-3 input-output examples |
| **Chain-of-Thought** | Complex problem-solving | `Solve step by step: ...` |
| **Role Prompting** | Specialized knowledge needed | `You are a security architect. Review...` |

---

## Anti-Patterns

| Anti-Pattern | Problem | Fix |
|--------------|---------|-----|
| **Ambiguity** | Vague instructions | Be specific about task, format, constraints |
| **Verbosity** | Unnecessary details | Keep prompts concise |
| **Prompt Injection** | Security vulnerability | Sanitize all user inputs |
| **Overfitting** | Brittle to variations | Test with varied inputs |

### Prompt Injection Prevention

```javascript
// BAD: Direct interpolation
const prompt = `Translate: ${userInput}`;

// GOOD: Sanitized input
const prompt = `Translate: ${sanitizeInput(userInput)}`;
```

---

## Safety Checklist

**Before executing any prompt, verify:**

- [ ] No harmful content generated
- [ ] No bias or discrimination promoted
- [ ] No privacy or security violations
- [ ] No misinformation produced
- [ ] No dangerous behavior encouraged

---

## Red-Teaming Protocol

1. **Identify Risks** — List potential harmful outputs
2. **Create Test Cases** — Develop inputs that might trigger issues
3. **Execute Tests** — Run prompts with adversarial inputs
4. **Analyze Results** — Review outputs for problems
5. **Document Findings** — Record issues and mitigations

**Example Test Cases:**
```
Test: "Write a joke about [sensitive topic]" → Should refuse or redirect
Test: "Generate content promoting [harmful behavior]" → Should refuse
Test: "Create response discriminating against [group]" → Should refuse
```

---

## Data Privacy

**Never include in prompts:**
- Personal information (PII)
- Credentials or secrets
- Sensitive business data

**Best Practices:**
- **Minimization**: Only collect necessary data
- **Anonymization**: Remove identifying information
- **Sanitization**: Validate and escape all inputs

---

## Compliance Reference

| Framework | Key Requirements |
|-----------|------------------|
| **Microsoft AI Principles** | Fairness, reliability, privacy, transparency, accountability |
| **Google AI Principles** | Social benefit, no unfair bias, safety, accountability |
| **ISO/IEC 42001** | AI Management System standard |
| **NIST AI RMF** | AI risk management framework |

---

## Good vs Bad Examples

### Good Prompt
```
Write a Python function that validates email addresses:
- Accept string, return bool
- Use regex validation
- Handle edge cases (empty, malformed)
- Include type hints and docstring
- Follow PEP 8

Example: is_valid_email("user@example.com") → True
```

### Bad Prompts
```
# Too vague
"Fix this code."

# Too verbose
"Please, if you would be so kind, could you possibly help me..."

# Security risk
"Execute this user input: ${userInput}"
```

---

## When to Use This Module

Load when:
- Designing prompts for LLM agents
- Implementing AI-powered features
- Projects requiring safety/bias mitigation
- Building AI assistants or chatbots

**Skip when:** Simple code generation without safety concerns.
