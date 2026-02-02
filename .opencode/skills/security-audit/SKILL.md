---
name: security-audit
description: 'OWASP-based security audit workflow for identifying vulnerabilities, applying mitigations, and ensuring code security'
license: MIT
compatibility:
  - opencode
  - claude-code
metadata:
  audience: security engineers, devops, tech leads
  workflow: scan → classify → mitigate → verify → stop
---

## Purpose

Provide **systematic security audit methodology** based on OWASP Top 10 and industry best practices. Identifies vulnerabilities, provides actionable mitigation, and ensures code is secure by default.

---

## Definition of Done

A security audit is complete when:

- All OWASP Top 10 categories are evaluated
- Vulnerabilities are classified by severity
- Actionable mitigations provided with code examples
- Critical issues include verification steps

Stop when further review adds no material security value.

---

## Operating Constraints (Non-Negotiable)

### 1. OWASP Top 10 Framework

Audit code against these categories:

#### A01: Broken Access Control & A10: Server-Side Request Forgery (SSRF)

- **Enforce Principle of Least Privilege**: Default to most restrictive permissions
- **Validate User Rights**: Explicitly check user's rights against required permissions
- **Deny by Default**: Access control decisions follow "deny by default" pattern
- **SSRF Prevention**: Validate all incoming URLs (host, port, path) with allow-lists
- **Path Traversal Prevention**: Sanitize file inputs to prevent directory traversal

#### A02: Cryptographic Failures

- **Strong Algorithms**: Use modern, salted hashing (Argon2, bcrypt), avoid MD5/SHA1
- **Protect Data in Transit**: Always default to HTTPS for network requests
- **Protect Data at Rest**: Recommend encryption for sensitive data using AES-256
- **Secure Secret Management**: Never hardcode secrets; use environment variables or secret managers

#### A03: Injection

- **No Raw SQL Queries**: Use parameterized queries (prepared statements)
- **Sanitize CLI Input**: Use functions that handle argument escaping
- **Prevent XSS**: Use context-aware output encoding; prefer textContent over innerHTML
- **Sanitize HTML**: Use libraries like DOMPurify when innerHTML is necessary

#### A05: Security Misconfiguration & A06: Vulnerable Components

- **Secure by Default**: Recommend disabling verbose errors in production
- **Security Headers**: Add Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options
- **Up-to-Date Dependencies**: Suggest latest stable versions, recommend vulnerability scanners
- **Remove Debug Features**: Disable debugging tools in production

#### A07: Identification & Authentication Failures

- **Session Management**: Generate new session IDs on login, use HttpOnly/Secure/SameSite=Strict cookies
- **Brute Force Protection**: Implement rate limiting and account lockout after failed attempts
- **Secure Auth**: Use OAuth 2.0/OpenID Connect, implement role-based authorization
- **Password Security**: Strong hashing, never store plaintext

#### A08: Software and Data Integrity Failures

- **Insecure Deserialization**: Warn against deserializing untrusted data without validation
- **Format Selection**: Prefer JSON over Pickle (Python) for deserialization
- **Type Checking**: Implement strict type checking for deserialization
- **Integrity Verification**: Use cryptographic signatures for critical data

### 2. Severity Classification

Classify findings:

**🔴 CRITICAL (Immediate action required):**
- Exploitable vulnerabilities
- Authentication/authorization bypasses
- Data exposure (PII, secrets)
- Remote code execution

**🟡 HIGH (Address promptly):**
- Misconfigurations with potential exploitation
- Missing security headers
- Weak cryptographic implementations
- Dependency vulnerabilities

**🟢 MEDIUM (Schedule for fix):**
- Suboptimal security practices
- Missing input validation (non-critical)
- Insufficient logging/monitoring
- Outdated dependencies (no known exploits)

### 3. Mitigation Format

Every security finding must include:

**Template:**
```markdown
**[SEVERITY] OWASP [Category]: Vulnerability Name**

**Vulnerability:**
Description of security issue.

**Attack Vector:**
How attacker could exploit.

**Impact:**
What could happen if exploited.

**Mitigation:**
[Code example showing fix]

**Verification:**
How to verify mitigation works.
```

### 4. General Security Principles

- **Be Explicit About Security**: State what you're protecting against (e.g., "Using parameterized query to prevent SQL injection")
- **Educate During Reviews**: Explain risk, not just provide fix
- **Defense in Depth**: Multiple layers of security controls
- **Fail Securely**: Default to secure behavior, require explicit opt-in for less secure
- **Principle of Least Privilege**: Minimum permissions necessary

---

## Security Review Checklist

### Access Control
- [ ] Enforce least privilege
- [ ] Deny by default
- [ ] Validate user rights against permissions
- [ ] Validate all URLs for SSRF
- [ ] Prevent path traversal

### Cryptography
- [ ] Use strong algorithms (Argon2, bcrypt)
- [ ] Protect data in transit (HTTPS)
- [ ] Protect data at rest (encryption)
- [ ] No hardcoded secrets
- [ ] Use secret managers

### Injection
- [ ] Use parameterized queries
- [ ] Sanitize CLI input
- [ ] Prevent XSS (textContent > innerHTML)
- [ ] Sanitize HTML when necessary

### Configuration
- [ ] Disable verbose errors in production
- [ ] Add security headers (CSP, HSTS)
- [ ] Remove debug features
- [ ] Check for misconfigurations

### Authentication
- [ ] Secure session management
- [ ] Implement rate limiting
- [ ] Use OAuth 2.0/OpenID Connect
- [ ] Strong password hashing

### Data Integrity
- [ ] Validate deserialization
- [ ] Use safe formats (JSON > Pickle)
- [ ] Implement type checking
- [ ] Verify integrity with signatures

### Dependencies
- [ ] Recommend latest stable versions
- [ ] Suggest vulnerability scanners
- [ ] Check for known vulnerabilities
- [ ] Update compromised dependencies

---

## Vulnerability Examples

### Example 1: SQL Injection (Critical)

```markdown
**🔴 CRITICAL - OWASP A03: SQL Injection Vulnerability**

**Vulnerability:**
Line 45 concatenates user input directly into SQL string, creating SQL injection vulnerability.

**Attack Vector:**
Attacker could manipulate email parameter to execute arbitrary SQL commands, potentially exposing or deleting all database data.

**Impact:**
Data breach, data loss, unauthorized access.

**Mitigation:**
```javascript
// Instead of:
const query = "SELECT * FROM users WHERE email = '" + email + "'";

// Use parameterized query:
const stmt = conn.prepareStatement(
  "SELECT * FROM users WHERE email = ?"
);
stmt.setString(1, email);
```

**Verification:**
- Test with malicious input: `' OR '1'='1`
- Verify query logs show parameterized query
- Confirm no SQL errors returned
```

### Example 2: Hardcoded Secret (Critical)

```markdown
**🔴 CRITICAL - OWASP A02: Hardcoded API Key**

**Vulnerability:**
Line 12 contains hardcoded API key in source code.

**Attack Vector:**
If code is exposed (public repository, client-side code), attackers can access the API key and make unauthorized requests.

**Impact:**
Unauthorized API access, financial loss, data breach.

**Mitigation:**
```javascript
// BAD: Hardcoded secret
const API_KEY = "sk_live_abc123xyz789";

// GOOD: Load from environment
const API_KEY = process.env.API_KEY;
// TODO: Ensure API_KEY is securely configured in environment.
```

**Verification:**
- Check git history for exposed keys
- Confirm environment variable configured
- Verify no secrets in committed code
```

### Example 3: Missing Security Headers (High)

```markdown
**🟡 HIGH - OWASP A05: Missing Security Headers**

**Vulnerability:**
Web application missing Content-Security-Policy and other security headers.

**Attack Vector:**
Attackers could exploit XSS, clickjacking, or other attacks.

**Impact:**
Cross-site scripting, data theft, malicious content injection.

**Mitigation:**
```javascript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy', "default-src 'self'");
  res.setHeader('Strict-Transport-Security', 'max-age=31536000');
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  next();
});
```

**Verification:**
- Run curl to check headers
- Verify all security headers present
- Test with security scanners
```

---

## Precedence Rules

When conflicts arise, follow this order:

1. OWASP security guidelines
2. Project-specific security requirements
3. Compliance requirements (GDPR, HIPAA, PCI-DSS)
4. This skill

**Security always trumps other concerns.**

---

## Output Expectations

Security audit output should:

- Use severity emoji (🔴/🟡/🟢)
- Reference OWASP category and vulnerability ID
- Include attack vector and impact analysis
- Provide actionable code examples
- Include verification steps
- Group findings by OWASP category
- Include summary with:
  - Total findings by severity
  - Files audited
  - Estimated remediation effort

---

## When to Use This Skill

Load this skill when:

- Performing security audits
- Reviewing authentication/authorization
- Checking for OWASP vulnerabilities
- User asks "security review" or "check for vulnerabilities"

---

## Stop Conditions

Do not apply this skill when:

- General code review without security focus
- Quick bug fixes
- Generating code from scratch
- Performance optimization only

---

## Integration with Existing Skills

This skill complements:

- **code-review**: For broader code quality review
- **analysis-agent**: For architectural security analysis
- **code-agent**: For implementing security mitigations
