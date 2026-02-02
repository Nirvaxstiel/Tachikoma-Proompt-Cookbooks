---
name: code-review
description: 'Structured code review workflow with priority-based classification, security focus, and actionable feedback'
license: MIT
compatibility:
  - opencode
  - claude-code
metadata:
  audience: code reviewers, tech leads, quality gatekeepers
  workflow: inspect → classify → document → verify → stop
---

## Purpose

Provide **systematic code review methodology** prioritizing security, correctness, and maintainability. Reviews are actionable, specific, and context-aware with clear priority classification.

---

## Definition of Done

A review is complete when:

- All issues are classified by priority (CRITICAL/IMPORTANT/SUGGESTION)
- Each issue includes concrete examples and fixes
- Good code is acknowledged and reinforced
- Review includes verification steps for critical fixes

Stop when further review adds no material value.

---

## Operating Constraints (Non-Negotiable)

### 1. Priority-Based Classification

Classify findings into:

**🔴 CRITICAL (Block merge):**
- Security vulnerabilities (SQL injection, XSS, exposed secrets)
- Correctness issues (logic errors, data corruption, race conditions)
- Breaking API changes without versioning
- Data loss or corruption risks

**🟡 IMPORTANT (Requires discussion):**
- SOLID principle violations
- Severe code duplication
- Missing tests for critical paths or new functionality
- Performance issues (N+1 queries, memory leaks, O(n²) algorithms)
- Architectural deviations from established patterns

**🟢 SUGGESTION (Non-blocking):**
- Readability improvements (poor naming, complex logic)
- Minor optimizations without functional impact
- Deviations from conventions
- Missing or incomplete documentation

### 2. Specific Feedback Format

Every review comment must include:

**Template:**
```markdown
**[PRIORITY] Category: Brief Title**

Detailed description of issue.

**Why this matters:**
Explanation of impact or risk.

**Suggested fix:**
[Code example showing improvement]
```

### 3. General Review Principles

- **Be specific**: Reference exact lines, files, and provide concrete examples
- **Provide context**: Explain WHY something is an issue and potential impact
- **Suggest solutions**: Show corrected code, not just what's wrong
- **Be constructive**: Focus on improving code, not criticizing the author
- **Recognize good practices**: Acknowledge well-written code and smart solutions
- **Be pragmatic**: Not every suggestion needs immediate implementation
- **Group related comments**: Avoid multiple comments about the same topic

### 4. Code Quality Standards

**Clean Code:**
- Descriptive and meaningful names
- Single Responsibility Principle: each function/class does one thing well
- DRY: no code duplication
- Functions small and focused (ideally < 20-30 lines)
- Avoid deeply nested code (max 3-4 levels)
- Avoid magic numbers and strings (use constants)

**Error Handling:**
- Proper error handling at appropriate levels
- Meaningful error messages
- No silent failures or ignored exceptions
- Fail fast: validate inputs early
- Use appropriate error types/exceptions

---

## Security Review Standards

### 1. Security Vulnerabilities

Check for:

- **Sensitive Data**: No passwords, API keys, tokens, or PII in code or logs
- **Input Validation**: All user inputs are validated and sanitized
- **SQL Injection**: Use parameterized queries, never string concatenation
- **Authentication**: Proper authentication checks before accessing resources
- **Authorization**: Verify user has permission to perform action
- **Cryptography**: Use established libraries, never roll your own crypto
- **Dependency Security**: Check for known vulnerabilities

### 2. Security Principles

- **Enforce Principle of Least Privilege**: Default to most restrictive permissions
- **Deny by Default**: Access control decisions follow "deny by default" pattern
- **Validate URLs for SSRF**: Treat user-provided URLs as untrusted
- **Prevent Path Traversal**: Sanitize file inputs to prevent directory traversal
- **Use Modern Crypto**: Recommend Argon2/bcrypt, avoid MD5/SHA1
- **Protect Data**: HTTPS in transit, encryption at rest
- **Secure Secrets**: Never hardcode, use environment variables or secret managers

---

## Testing Standards

Verify test quality:

- **Coverage**: Critical paths and new functionality must have tests
- **Test Names**: Descriptive names explaining what is being tested
- **Test Structure**: Clear Arrange-Act-Assert or Given-When-Then pattern
- **Independence**: Tests don't depend on each other or external state
- **Assertions**: Use specific assertions, avoid generic assertTrue/assertFalse
- **Edge Cases**: Test boundary conditions, null values, empty collections
- **Mock Appropriately**: Mock external dependencies, not domain logic

---

## Performance Considerations

Check for performance issues:

- **Database Queries**: Avoid N+1 queries, use proper indexing
- **Algorithms**: Appropriate time/space complexity for use case
- **Caching**: Utilize caching for expensive or repeated operations
- **Resource Management**: Proper cleanup of connections, files, streams
- **Pagination**: Large result sets should be paginated
- **Lazy Loading**: Load data only when needed

---

## Architecture and Design

Verify architectural principles:

- **Separation of Concerns**: Clear boundaries between layers/modules
- **Dependency Direction**: High-level modules don't depend on low-level details
- **Interface Segregation**: Prefer small, focused interfaces
- **Loose Coupling**: Components independently testable
- **High Cohesion**: Related functionality grouped together
- **Consistent Patterns**: Follow established patterns in codebase

---

## Documentation Standards

Check documentation:

- **API Documentation**: Public APIs documented (purpose, parameters, returns)
- **Complex Logic**: Non-obvious logic has explanatory comments
- **README Updates**: Update README when adding features or changing setup
- **Breaking Changes**: Document breaking changes clearly
- **Examples**: Provide usage examples for complex features

---

## Precedence Rules

When conflicts arise, follow this order:

1. OWASP security guidelines
2. Project-specific conventions
3. This skill
4. Language/framework defaults

**Security always trumps style.**

---

## Output Expectations

Review output should:

- Use priority emoji (🔴/🟡/🟢)
- Group related issues together
- Acknowledge well-written code explicitly
- Provide verification steps for critical fixes
- Include summary with:
  - Total issues by priority
  - Files reviewed
  - Estimated remediation effort

---

## Review Checklist

Before completing review, verify:

### Code Quality
- [ ] Code follows consistent style and conventions
- [ ] Names are descriptive and follow naming conventions
- [ ] Functions/methods are small and focused
- [ ] No code duplication
- [ ] Complex logic broken into simpler parts
- [ ] Error handling appropriate
- [ ] No commented-out code or TODO without tickets

### Security
- [ ] No sensitive data in code or logs
- [ ] Input validation on all user inputs
- [ ] No SQL injection vulnerabilities
- [ ] Authentication and authorization properly implemented
- [ ] Dependencies up-to-date and secure

### Testing
- [ ] New code has appropriate test coverage
- [ ] Tests well-named and focused
- [ ] Tests cover edge cases and error scenarios
- [ ] Tests independent and deterministic
- [ ] No tests that always pass or are commented out

### Performance
- [ ] No obvious performance issues (N+1, memory leaks)
- [ ] Appropriate use of caching
- [ ] Efficient algorithms and data structures
- [ ] Proper resource cleanup

### Architecture
- [ ] Follows established patterns and conventions
- [ ] Proper separation of concerns
- [ ] No architectural violations
- [ ] Dependencies flow in correct direction

### Documentation
- [ ] Public APIs documented
- [ ] Complex logic has explanatory comments
- [ ] README updated if needed
- [ ] Breaking changes documented

---

## When to Use This Skill

Load this skill when:

- Reviewing pull requests or code changes
- Performing security audits
- Assessing code quality and architecture
- User asks "review this code" or "code review"

---

## Stop Conditions

Do not apply this skill when:

- Quick syntax fixes
- Explaining code without review
- Generating code from scratch
- Simple refactoring without review intent

---

## Integration with Existing Skills

This skill complements:

- **code-agent**: For implementing review suggestions
- **analysis-agent**: For deeper architectural analysis
- **security-audit**: For specialized security review
