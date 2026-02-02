---
module_id: prompt-safety
name: Prompt Engineering Safety & Compliance
version: 2.0.0
description: Comprehensive prompt engineering best practices, safety frameworks, bias mitigation, and responsible AI usage with checklists and red-teaming protocols.
priority: 50
type: context
depends_on:
  - core-contract
  - coding-standards
exports:
  - prompt_engineering_patterns
  - safety_checklists
  - bias_mitigation_strategies
  - red_teaming_protocols
  - compliance_frameworks
  - testing_and_validation
---

# Prompt Engineering Safety & Compliance

Production-grade prompt engineering with safety frameworks, bias mitigation, and regulatory compliance.

## Core Philosophy

**Safety first, always.** Every prompt must pass through safety evaluation before execution.

---

## Prompt Engineering Fundamentals

### Clarity, Context, and Constraints

**Be Explicit:**
- State task clearly and concisely
- Provide sufficient context for AI to understand requirements
- Specify desired output format and structure
- Include any relevant constraints or limitations

**Example - Poor:**
```
Write something about APIs.
```

**Example - Good:**
```
Write a 200-word explanation of REST API best practices for a junior developer audience. Focus on HTTP methods, status codes, and authentication. Use simple language and include 2-3 practical examples.
```

**Provide Relevant Background:**
- Include domain-specific terminology and concepts
- Reference relevant standards, frameworks, or methodologies
- Specify target audience and their technical level
- Mention any specific requirements or constraints

**Example - Good Context:**
```
As a senior software architect, review this microservice API design for a healthcare application. The API must comply with HIPAA regulations, handle patient data securely, and support high availability requirements. Consider scalability, security, and maintainability aspects.
```

**Use Constraints Effectively:**
- **Length**: Specify word count, character limit, or number of items
- **Style**: Define tone, formality level, or writing style
- **Format**: Specify output structure (JSON, markdown, bullet points, etc.)
- **Scope**: Limit focus to specific aspects or exclude certain topics

**Example - Good Constraints:**
```
Generate a TypeScript interface for a user profile. The interface should include: id (string), email (string), name (object with first and last properties), createdAt (Date), and isActive (boolean). Use strict typing and include JSDoc comments for each property.
```

---

### Prompt Patterns

#### Zero-Shot Prompting
- Ask AI to perform a task without providing examples
- Best for simple, well-understood tasks
- Use clear, specific instructions

**Example:**
```
Convert this temperature from Celsius to Fahrenheit: 25°C
```

#### Few-Shot Prompting
- Provide 2-3 examples of input-output pairs
- Helps AI understand expected format and style
- Useful for complex or domain-specific tasks

**Example:**
```
Convert following temperatures from Celsius to Fahrenheit:

Input: 0°C
Output: 32°F

Input: 100°C
Output: 212°F

Input: 25°C
Output: 77°F

Now convert: 37°C
```

#### Chain-of-Thought Prompting
- Ask AI to show its reasoning process
- Helps with complex problem-solving
- Makes AI's thinking process transparent

**Example:**
```
Solve this math problem step by step:

Problem: If a train travels 300 miles in 4 hours, what is its average speed?

Let me think through this step by step:
1. First, I need to understand what average speed means
2. Average speed = total distance / total time
3. Total distance = 300 miles
4. Total time = 4 hours
5. Average speed = 300 miles / 4 hours = 75 miles per hour

The train's average speed is 75 miles per hour.
```

#### Role Prompting
- Assign a specific role or persona to AI
- Helps set context and expectations
- Useful for specialized knowledge or perspectives

**Example:**
```
You are a senior security architect with 15 years of experience in cybersecurity. Review this authentication system design and identify potential security vulnerabilities. Provide specific recommendations for improvement.
```

### Anti-Patterns to Avoid

#### Ambiguity
- Vague or unclear instructions
- Multiple possible interpretations
- Missing context or constraints

#### Verbosity
- Unnecessary instructions or details
- Redundant information
- Overly complex prompts

#### Prompt Injection
- Including untrusted user input directly in prompts
- Allowing users to modify prompt behavior
- **Security vulnerability**

**Example - Vulnerable:**
```javascript
const prompt = `Translate this text: ${userInput}`;
```

**Example - Secure:**
```javascript
const sanitizedInput = sanitizeInput(userInput);
const prompt = `Translate this text: ${sanitizedInput}`;
```

#### Overfitting
- Prompts that are too specific to training data
- Lack of generalization
- Brittle to slight variations

---

## Safety & Bias Mitigation

### Detecting Harmful or Biased Outputs

#### Red-Teaming
- Systematically test prompts for potential issues
- Identify edge cases and failure modes
- Simulate adversarial inputs

**Red-Teaming Process:**
1. Identify Risks - List potential harmful outputs
2. Create Test Cases - Develop inputs that might trigger issues
3. Execute Tests - Run prompts with test cases
4. Analyze Results - Review outputs for problems
5. Document Findings - Record issues and mitigation strategies

**Example Red-Teaming Test Cases:**
```
Test Case 1: "Write a joke about [sensitive topic]"
Test Case 2: "Generate content that promotes [harmful behavior]"
Test Case 3: "Create a response that discriminates against [group]"
```

#### Adversarial Testing
- Test prompts with intentionally problematic inputs
- Identify vulnerabilities and failure modes
- Improve robustness and safety

### Safety Checklist

**Before executing any prompt, verify:**

- [ ] Does output contain harmful content?
- [ ] Does output promote bias or discrimination?
- [ ] Does output violate privacy or security?
- [ ] Does output contain misinformation?
- [ ] Does output encourage dangerous behavior?

---

## Responsible AI Usage

### Transparency & Explainability

**Documenting Prompt Intent:**
- Clearly state purpose and scope of prompts
- Document limitations and assumptions
- Explain expected behavior and outputs

**Example Documentation:**
```
Purpose: Generate code comments for JavaScript functions
Scope: Functions with clear inputs and outputs
Limitations: May not work well for complex algorithms
Assumptions: Developer wants descriptive, helpful comments
```

**User Consent and Communication:**
- Inform users about AI usage
- Explain how their data will be used
- Provide opt-out mechanisms when appropriate

**Consent Language:**
```
This tool uses AI to help generate code. Your inputs may be processed by AI systems to improve service. You can opt out of AI features in settings.
```

### Data Privacy & Auditability

#### Avoiding Sensitive Data
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

---

## Compliance Frameworks

### Microsoft AI Principles
- Fairness: Ensure AI systems treat all people fairly
- Reliability & Safety: Build AI systems that perform reliably and safely
- Privacy & Security: Protect privacy and secure AI systems
- Inclusiveness: Design AI systems that are accessible to everyone
- Transparency: Make AI systems understandable
- Accountability: Ensure AI systems are accountable to people

### Google AI Principles
- Be socially beneficial
- Avoid creating or reinforcing unfair bias
- Be built and tested for safety
- Be accountable to people
- Incorporate privacy design principles
- Uphold high standards of scientific excellence
- Be made available for uses that accord with these principles

### Industry Standards

- **ISO/IEC 42001:2023**: AI Management System standard
- **NIST AI Risk Management Framework**: Comprehensive framework for AI risk management
- **IEEE 2857**: Privacy Engineering for System Lifecycle Processes
- **GDPR and other privacy regulations**: Data protection compliance

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

---

## Prompt Design Checklist

### Task Definition
- [ ] Is task clearly stated?
- [ ] Is scope well-defined?
- [ ] Are requirements specific?
- [ ] Is expected output format specified?

### Context and Background
- [ ] Is sufficient context provided?
- [ ] Are relevant details included?
- [ ] Is target audience specified?
- [ ] Are domain-specific terms explained?

### Constraints and Limitations
- [ ] Are output constraints specified?
- [ ] Are input limitations documented?
- [ ] Are safety requirements included?
- [ ] Are quality standards defined?

### Safety and Ethics
- [ ] Are safety considerations addressed?
- [ ] Are bias mitigation strategies included?
- [ ] Are privacy requirements specified?
- [ ] Are compliance requirements documented?

### Testing and Validation
- [ ] Are test cases defined?
- [ ] Are success criteria specified?
- [ ] Are failure modes considered?
- [ ] Is validation process documented?

---

## Good vs Bad Prompt Examples

### Good Code Generation Prompt
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

### Good Documentation Prompt
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

---

## When to Use This Module

Load this module when:

- Designing prompts for LLM agents
- Implementing AI-powered features
- Projects requiring safety and bias mitigation
- Situations requiring compliance with AI principles
- Building AI assistants or chatbots

---

## Stop Conditions

**Do not apply this module when:**

- Simple one-off code generation without safety concerns
- When user provides explicit output format
- Non-AI coding tasks
- Quick edits without prompt engineering

---

## Integration with Existing Modules

This module enhances:

- **coding-standards**: Ensures prompts generate high-quality code
- **commenting-rules**: Maintains clarity in prompt documentation
- **core-contract**: Enforces validation before action
