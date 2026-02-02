---
name: prompt-engineer
description: 'Comprehensive prompt engineering workflow with safety frameworks, bias mitigation, and responsible AI usage'
license: MIT
compatibility:
  - opencode
  - claude-code
metadata:
  audience: AI engineers, prompt designers, ML practitioners
  workflow: analyze → apply → red-team → validate → stop
---

## Purpose

Provide **rigorous prompt engineering methodology** ensuring prompts are effective, safe, unbiased, and compliant with AI ethics. Includes safety checklists, red-teaming protocols, and compliance frameworks.

---

## Definition of Done

A prompt design task is complete when:

- Prompt clearly states task with sufficient context
- Safety and bias checks are documented
- Appropriate pattern is applied (zero-shot, few-shot, chain-of-thought, role)
- Output format and constraints specified
- Red-teaming scenarios tested

Stop when further refinement adds no material value.

---

## Operating Constraints (Non-Negotiable)

### 1. Clarity, Context, and Constraints

**Be Explicit:**
- State task clearly and concisely
- Provide sufficient context for AI to understand requirements
- Specify desired output format and structure
- Include any relevant constraints or limitations

**Provide Relevant Background:**
- Include domain-specific terminology and concepts
- Reference relevant standards, frameworks, or methodologies
- Specify target audience and their technical level
- Mention any specific requirements or constraints

**Use Constraints Effectively:**
- **Length**: Specify word count, character limit, or number of items
- **Style**: Define tone, formality level, or writing style
- **Format**: Specify output structure (JSON, markdown, bullet points)
- **Scope**: Limit focus to specific aspects or exclude certain topics

### 2. Prompt Patterns

Apply appropriate pattern:

**Zero-Shot Prompting:**
- Ask AI to perform task without examples
- Best for simple, well-understood tasks
- Use clear, specific instructions

**Few-Shot Prompting:**
- Provide 2-3 examples of input-output pairs
- Helps AI understand expected format and style
- Useful for complex or domain-specific tasks

**Chain-of-Thought Prompting:**
- Ask AI to show reasoning process
- Helps with complex problem-solving
- Makes AI's thinking process transparent

**Role Prompting:**
- Assign specific role or persona to AI
- Helps set context and expectations
- Useful for specialized knowledge or perspectives

### 3. Anti-Patterns to Avoid

**Ambiguity:**
- Vague or unclear instructions
- Multiple possible interpretations
- Missing context or constraints

**Verbosity:**
- Unnecessary instructions or details
- Redundant information
- Overly complex prompts

**Prompt Injection:**
- Including untrusted user input directly in prompts
- Allowing users to modify prompt behavior
- **Security vulnerability**

**Overfitting:**
- Prompts too specific to training data
- Lack of generalization
- Brittle to slight variations

---

## Safety & Bias Mitigation

### 1. Red-Teaming Process

Systematically test prompts for potential issues:

**Process:**
1. **Identify Risks**: List potential harmful outputs
2. **Create Test Cases**: Develop inputs that might trigger issues
3. **Execute Tests**: Run prompts with test cases
4. **Analyze Results**: Review outputs for problems
5. **Document Findings**: Record issues and mitigation strategies

**Example Test Cases:**
```
Test Case 1: "Write a joke about [sensitive topic]"
Test Case 2: "Generate content that promotes [harmful behavior]"
Test Case 3: "Create response that discriminates against [group]"
```

### 2. Bias Mitigation

**Prompt Phrasing to Reduce Bias:**
- Use inclusive and neutral language
- Avoid assumptions about users or contexts
- Include diversity and fairness considerations

**Example:**
```diff
# Biased (BAD):
Write a story about a doctor. The doctor should be male and middle-aged.

# Inclusive (GOOD):
Write a story about a healthcare professional. Consider diverse backgrounds and experiences.
```

### 3. Safety Checklist

Before deploying prompt, verify:

- [ ] Does output contain harmful content?
- [ ] Does output promote bias or discrimination?
- [ ] Does output violate privacy or security?
- [ ] Does output contain misinformation?
- [ ] Does output encourage dangerous behavior?

---

## Responsible AI Usage

### 1. Transparency & Explainability

**Documenting Prompt Intent:**
- Clearly state purpose and scope
- Document limitations and assumptions
- Explain expected behavior and outputs

**User Consent and Communication:**
- Inform users about AI usage
- Explain how their data will be used
- Provide opt-out mechanisms when appropriate

**Explainability:**
- Make AI decision-making transparent
- Provide reasoning for outputs when possible
- Help users understand AI limitations

### 2. Data Privacy & Auditability

**Avoiding Sensitive Data:**
- Never include personal information in prompts
- Sanitize user inputs before processing
- Implement data minimization practices

**Data Handling Best Practices:**
- **Minimization**: Only collect necessary data
- **Anonymization**: Remove identifying information
- **Encryption**: Protect data in transit and at rest
- **Retention**: Limit data storage duration

**Logging and Audit Trails:**
- Record prompt inputs and outputs
- Track system behavior and decisions
- Maintain audit logs for compliance

### 3. Compliance Frameworks

**Microsoft AI Principles:**
- Fairness: Ensure AI systems treat all people fairly
- Reliability & Safety: Build systems that perform reliably and safely
- Privacy & Security: Protect privacy and secure AI systems
- Inclusiveness: Design systems accessible to everyone
- Transparency: Make AI systems understandable
- Accountability: Ensure AI systems are accountable to people

**Google AI Principles:**
- Be socially beneficial
- Avoid creating or reinforcing unfair bias
- Be built and tested for safety
- Be accountable to people
- Incorporate privacy design principles
- Uphold high standards of scientific excellence

**Industry Standards:**
- **ISO/IEC 42001:2023**: AI Management System standard
- **NIST AI Risk Management Framework**: Comprehensive framework for AI risk management
- **IEEE 2857**: Privacy Engineering for System Lifecycle Processes
- **GDPR and other privacy regulations**: Data protection compliance

---

## Security

### Preventing Prompt Injection

**Never Interpolate Untrusted Input:**
- Avoid directly inserting user input into prompts
- Use input validation and sanitization
- Implement proper escaping mechanisms

**Input Validation and Sanitization:**
- Validate input format and content
- Remove or escape dangerous characters
- Implement length and content restrictions

**Secure Prompt Construction:**
- Use parameterized prompts when possible
- Implement proper escaping for dynamic content
- Validate prompt structure and content

---

## Testing & Validation

### Automated Prompt Evaluation

**Test Cases:**
- Define expected inputs and outputs
- Create edge cases and error conditions
- Test for safety, bias, and security issues

**Evaluation Metrics:**
- **Accuracy**: How well output matches expectations
- **Relevance**: How closely output addresses input
- **Safety**: Absence of harmful or biased content
- **Consistency**: Similar inputs produce similar outputs
- **Efficiency**: Speed and resource usage

### Human-in-the-Loop Review

**Peer Review:**
- Have multiple people review prompts
- Include diverse perspectives and backgrounds
- Document review decisions and feedback

**Feedback Cycles:**
- Collect feedback from users and reviewers
- Implement improvements based on feedback
- Track feedback and improvement metrics

---

## Prompt Templates

### Good Prompt Examples

**Good Code Generation Prompt:**
```
Write a Python function that validates email addresses. The function should:
- Accept a string input
- Return True if email is valid, False otherwise
- Use regex for validation
- Handle edge cases like empty strings and malformed emails
- Include type hints and docstring
- Follow PEP 8 style guidelines

Example usage:
is_valid_email("user@example.com")  # Should return True
is_valid_email("invalid-email")     # Should return False
```

**Good Documentation Prompt:**
```
Write a README section for a REST API endpoint. The section should:
- Describe endpoint purpose and functionality
- Include request/response examples
- Document all parameters and their types
- List possible error codes and their meanings
- Provide usage examples in multiple languages
- Follow markdown formatting standards

Target audience: Junior developers integrating with API
```

### Bad Prompt Examples

**Too Vague:**
```
Fix this code.
```

**Too Verbose:**
```
Please, if you would be so kind, could you possibly help me by writing some code that might be useful for creating a function that could potentially handle user input validation, if that's not too much trouble?
```

**Security Risk:**
```
Execute this user input: ${userInput}
```

**Biased:**
```
Write a story about a successful CEO. The CEO should be male and from a wealthy background.
```

---

## When to Use This Skill

Load this skill when:

- Designing prompts for LLM agents
- Implementing AI-powered features
- Projects requiring safety and bias mitigation
- Situations requiring compliance with AI principles
- Building AI assistants or chatbots

---

## Stop Conditions

Do not apply this skill when:

- Simple one-off code generation without safety concerns
- When user provides explicit output format
- Non-AI coding tasks
- Quick edits without prompt engineering

---

## Integration with Existing Skills

This skill enhances:

- **code-agent**: Ensures generated code follows prompt engineering best practices
- **commenting-rules**: Maintains clarity in prompt documentation
- **core-contract**: Enforces validation before action
