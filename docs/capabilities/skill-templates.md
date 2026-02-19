# SKILL.md Template and Examples

Ready-to-use templates and curated examples for creating Agent Skills.

## Quick Start Template

Copy this template and customize for your skill:

```yaml
---
name: your-skill-name
description: A clear, descriptive description of what this skill does and when to use it. Include relevant keywords.
license: Apache-2.0
metadata:
  version: "1.0"
  author: your-name
  category: category-name
  tags: [tag1, tag2, tag3]
---

# Your Skill Name

## Purpose

[One sentence explaining the main purpose of this skill]

## When to Use This Skill

Activate this skill when the user wants to:
- [Task/Goal 1]
- [Task/Goal 2]
- [Task/Goal 3]

Or when the user mentions:
- [keyword1]
- [keyword2]
- [keyword3]

## Capabilities

This skill can:
- [Capability 1]
- [Capability 2]
- [Capability 3]

## Workflow

### 1. [Step Name]

[Instructions for this step]

### 2. [Step Name]

[Instructions for this step]

### 3. [Step Name]

[Instructions for this step]

## Tools to Use

- `Tool1`: [When and how to use]
- `Tool2`: [When and how to use]
- `Tool3`: [When and how to use]

## Examples

### Example 1: [Title]

**User:** [User query]

**Response:** [Expected response format]

### Example 2: [Title]

**User:** [User query]

**Response:** [Expected response format]

## Boundaries

- Don't do [X]
- Always check [Y] before proceeding
- Limit to [Z]

## Error Handling

If [error condition]:
1. Identify the issue
2. Report the problem clearly
3. Suggest recovery actions
4. Offer to retry

## References

- [Agent Skills Specification](https://agentskills.io)
```

## Example Skills Gallery

### Example 1: Simple Information Retrieval

**Use case:** Fetching and presenting information from files

```yaml
---
name: api-documentation-fetcher
description: Fetch API documentation from various sources and format it for easy reference. Use when user asks about API docs, endpoints, or service specifications.
license: Apache-2.0
metadata:
  version: "1.0"
  author: tachikoma
  category: documentation
  tags: [api, documentation, reference]
---

# API Documentation Fetcher

## Purpose

Quickly retrieve and format API documentation from project files, external URLs, or generated specs.

## When to Use This Skill

Activate this skill when the user wants to:
- Find API endpoint documentation
- Get API reference information
- Check API specifications
- Review API authentication methods

Or when the user mentions:
- "API docs"
- "endpoint documentation"
- "API reference"
- "service specification"

## Capabilities

This skill can:
- Read local API documentation files
- Fetch documentation from URLs
- Parse OpenAPI/Swagger specs
- Format documentation for easy reading
- Search for specific endpoints or methods

## Workflow

### 1. Locate Documentation

First, find where the API documentation is located:
- Check common locations (`docs/api/`, `api/`, `swagger/`)
- Look for OpenAPI specs (`openapi.yaml`, `swagger.json`)
- Check for README files with API info
- Search for API-related keywords

### 2. Read Documentation

Read the documentation files using appropriate tools:
- `Read` for local files
- `WebFetch` for URLs
- `Grep` to search for specific content

### 3. Format Output

Present the information in a clear, structured format:
```
## [API Name]

### Endpoint: [Method] /path
- Description: [what it does]
- Parameters: [list]
- Response: [format]
```

### 4. Handle Missing Info

If documentation is incomplete:
- Report what was found
- Note what's missing
- Suggest where to look next

## Tools to Use

- `Read`: To read local documentation files
- `WebFetch`: To fetch documentation from URLs
- `Grep`: To search for specific endpoints or methods
- `Bash`: To run documentation generation tools

## Examples

### Example 1: Get User Endpoint Documentation

**User:** "Show me the documentation for the user endpoints"

**Response:**
I'll find the user endpoint documentation for you...

[Finds and formats documentation like this:]

## User API

### GET /api/users/{id}
- Description: Get user by ID
- Parameters:
  - `id` (path): User ID
- Response: User object

### POST /api/users
- Description: Create new user
- Body: User object
- Response: Created user with ID

### Example 2: Search for Authentication Docs

**User:** "How do I authenticate with the API?"

**Response:**
I'll search the API documentation for authentication information...

[Finds and presents authentication methods]

## Boundaries

- Don't generate mock documentation
- Don't assume behavior not documented
- Don't execute API calls (documentation only)
- Limit to what's actually documented

## Error Handling

If documentation not found:
1. Check alternative locations
2. Report that documentation is missing
3. Suggest checking with team
4. Offer to help create documentation

If documentation format is unclear:
1. Report format issues
2. Show what was readable
3. Ask for clarification

## References

- [OpenAPI Specification](https://spec.openapis.org/oas/latest.html)
```

### Example 2: Code Transformation

**Use case:** Modifying code according to patterns or rules

```yaml
---
name: dependency-updater
description: Update project dependencies to latest compatible versions following semantic versioning. Use when user wants to update packages, libraries, or dependencies.
license: Apache-2.0
metadata:
  version: "1.0"
  author: tachikoma
  category: dependency-management
  tags: [dependencies, packages, updates]
---

# Dependency Updater

## Purpose

Safely update project dependencies to their latest compatible versions while maintaining stability.

## When to Use This Skill

Activate this skill when the user wants to:
- Update dependencies to latest versions
- Check for outdated packages
- Upgrade specific libraries
- Review dependency security updates

Or when the user mentions:
- "update dependencies"
- "upgrade packages"
- "outdated libraries"
- "dependency security"

## Capabilities

This skill can:
- Check current dependency versions
- Find latest compatible versions
- Respect semantic versioning constraints
- Identify security updates
- Generate update commands
- Create PRs with updates

## Workflow

### 1. Analyze Current State

Read dependency files:
- `package.json` (Node.js)
- `requirements.txt` (Python)
- `Gemfile` (Ruby)
- `go.mod` (Go)
- `pom.xml` (Maven)

Check for:
- Current versions
- Version constraints (^, ~, etc.)
- Lock files

### 2. Check for Updates

For each dependency:
- Query package registry
- Find latest version
- Check semantic compatibility
- Check for security advisories

### 3. Plan Updates

Categorize updates:
- **Patch**: bug fixes (0.0.X)
- **Minor**: new features (0.X.0)
- **Major**: breaking changes (X.0.0)

Prioritize:
1. Security updates (highest)
2. Patch updates (low risk)
3. Minor updates (medium risk)
4. Major updates (high risk)

### 4. Generate Update Commands

For each package manager:

**Node.js (npm/yarn):**
```bash
npm update package-name
# or
yarn upgrade package-name
```

**Python (pip):**
```bash
pip install --upgrade package-name
```

**Ruby (bundler):**
```bash
bundle update package-name
```

### 5. Verify Compatibility

After updating:
- Run tests
- Check for breaking changes
- Review changelogs
- Validate application startup

### 6. Document Changes

Create/update `CHANGELOG.md`:
```markdown
## [Date] - Dependency Updates

### Updated
- package-name: 1.2.3 → 1.2.4 (security patch)
- other-package: 2.0.0 → 2.1.0 (minor feature)

### Security Fixes
- package-name: Fixed CVE-2024-XXXX
```

## Tools to Use

- `Read`: Read dependency files
- `Bash`: Run update commands
- `Grep`: Search for version references
- `WebFetch`: Check package registries and security advisories

## Examples

### Example 1: Check for Outdated Dependencies

**User:** "Check what dependencies need updating"

**Response:**
I'll check your dependencies for available updates...

```markdown
## Dependency Updates

### Security Updates (Priority 1)
- `express`: 4.18.1 → 4.18.2 (CVE-2024-XXXX)
- `lodash`: 4.17.20 → 4.17.21 (CVE-2024-YYYY)

### Patch Updates (Priority 2)
- `react`: 18.2.0 → 18.2.1
- `typescript`: 5.0.0 → 5.0.4

### Minor Updates (Priority 3)
- `axios`: 1.3.0 → 1.4.0
- `jest`: 29.5.0 → 29.6.0

### Major Updates (Priority 4 - Manual Review)
- `next`: 13.0.0 → 14.0.0 (breaking changes)
```

### Example 2: Update a Specific Package

**User:** "Update express to the latest version"

**Response:**
I'll update express to the latest compatible version...

```bash
npm update express
```

Updated `express` from 4.18.1 to 4.18.2.

Run tests to verify compatibility:
```bash
npm test
```

## Boundaries

- Don't update without user confirmation for major versions
- Don't ignore semantic versioning constraints
- Don't update if tests fail
- Always check for breaking changes before major updates

## Error Handling

If update fails:
1. Check for version conflicts
2. Review error messages
3. Check peer dependencies
4. Suggest manual resolution

If tests fail after update:
1. Identify failing tests
2. Check for breaking changes
3. Review changelog
4. Offer to rollback

## Compatibility Rules

Respect these version constraint formats:

### npm/yarn
- `^1.2.3`: Compatible with >=1.2.3 and <2.0.0
- `~1.2.3`: Compatible with >=1.2.3 and <1.3.0
- `*`: Any version
- `1.2.3`: Exact version only

### pip
- `>=1.2.3`: Minimum version
- `~=1.2.3`: Compatible release (>=1.2.3 and <2.0.0)
- `==1.2.3`: Exact version

## Security Advisory Sources

Check these sources for security updates:
- [npm advisory](https://www.npmjs.com/advisories)
- [PyPI security](https://pypi.org/security/)
- [GitHub Security Advisories](https://github.com/advisories)
- [Snyk](https://snyk.io/advisor/)

## References

- [Semantic Versioning](https://semver.org/)
```

### Example 3: Multi-Step Workflow

**Use case:** Orchestrating a complex process

```yaml
---
name: deployment-workflow
description: Manage complete deployment workflows including pre-deployment checks, building, testing, staging deployment, production deployment, and post-deployment verification.
license: Apache-2.0
metadata:
  version: "1.0"
  author: tachikoma
  category: deployment
  tags: [deployment, ci-cd, release]
---

# Deployment Workflow

## Purpose

Orchestrate end-to-end deployment workflows with safety checks, rollback capabilities, and comprehensive verification.

## When to Use This Skill

Activate this skill when the user wants to:
- Deploy to production
- Run through full deployment pipeline
- Perform staged deployments
- Roll back failed deployments

Or when the user mentions:
- "deploy"
- "release to production"
- "deployment pipeline"
- "rollback"

## Capabilities

This skill can:
- Run pre-deployment checks
- Build and test applications
- Deploy to staging environments
- Deploy to production
- Verify deployments
- Rollback on failure
- Generate deployment reports

## Workflow

### Phase 1: Pre-Deployment Checks

**Objective:** Ensure deployment is safe to proceed

1. **Check Git Status**
   - Verify branch is clean
   - Confirm correct branch
   - Check for uncommitted changes

2. **Check Test Status**
   - Verify all tests pass
   - Check test coverage
   - Review recent test failures

3. **Check Dependencies**
   - Verify all dependencies installed
   - Check for security advisories
   - Review version compatibility

4. **Check Configuration**
   - Verify environment variables
   - Check config files
   - Review deployment settings

5. **Get Approval**
   - Request deployment approval
   - Confirm deployment window
   - Verify stakeholders are notified

### Phase 2: Build and Test

**Objective:** Build artifacts and run verification

1. **Build Application**
   - Run build process
   - Generate artifacts
   - Verify build output

2. **Run Tests**
   - Unit tests
   - Integration tests
   - End-to-end tests
   - Performance tests

3. **Create Artifacts**
   - Package application
   - Generate version tags
   - Create deployment bundle

4. **Security Scan**
   - Run security scanner
   - Check for vulnerabilities
   - Review scan results

### Phase 3: Staging Deployment

**Objective:** Deploy to staging for final verification

1. **Deploy to Staging**
   - Run staging deployment
   - Verify deployment success
   - Check service health

2. **Staging Verification**
   - Run smoke tests
   - Perform manual testing
   - Verify critical features
   - Check logs for errors

3. **Staging Approval**
   - Get QA approval
   - Confirm staging works correctly
   - Document any issues found

### Phase 4: Production Deployment

**Objective:** Deploy to production with monitoring

1. **Pre-Deploy Notification**
   - Notify team of deployment
   - Set deployment in progress status
   - Start monitoring

2. **Deploy to Production**
   - Run production deployment
   - Monitor deployment progress
   - Check for errors

3. **Health Check**
   - Verify service is up
   - Check endpoints respond
   - Monitor error rates
   - Verify database connections

### Phase 5: Post-Deployment Verification

**Objective:** Verify deployment was successful

1. **Functional Verification**
   - Test critical user flows
   - Verify new features work
   - Check regressions

2. **Performance Verification**
   - Check response times
   - Monitor error rates
   - Review resource usage

3. **Monitoring**
   - Review application logs
   - Check metrics dashboards
   - Monitor alerts

### Phase 6: Rollback (If Needed)

**Objective:** Safely rollback if issues occur

1. **Detect Failure**
   - Identify deployment failure
   - Assess impact scope
   - Determine rollback necessity

2. **Execute Rollback**
   - Run rollback commands
   - Verify rollback success
   - Check service health

3. **Post-Rollback**
   - Investigate failure cause
   - Fix identified issues
   - Plan retry deployment

## Tools to Use

- `Bash`: Run build, test, and deployment commands
- `Read`: Read configuration and build files
- `Grep`: Search for logs and errors
- `Write`: Generate deployment reports

## Examples

### Example 1: Full Deployment Workflow

**User:** "Deploy version 1.2.3 to production"

**Response:**
I'll run the full deployment workflow for version 1.2.3...

```markdown
## Phase 1: Pre-Deployment Checks

✅ Git status: Clean, on branch `main`
✅ Tests: All passing (127/127)
✅ Dependencies: All installed, no security issues
✅ Configuration: Environment variables verified

✅ Ready for deployment

## Phase 2: Build and Test

Building application...
✅ Build successful (v1.2.3)

Running tests...
✅ Unit tests: 105/105 passing
✅ Integration tests: 20/20 passing
✅ E2E tests: 2/2 passing

Security scan...
✅ No vulnerabilities found

## Phase 3: Staging Deployment

Deploying to staging...
✅ Staging deployment successful

Staging verification...
✅ Smoke tests: 5/5 passing
✅ Manual QA: Approved

## Phase 4: Production Deployment

⏱️ Deploying to production...

✅ Production deployment successful
✅ Health checks: All passing

## Phase 5: Post-Deployment Verification

✅ Functional verification: All critical flows working
✅ Performance: Response times within SLA
✅ Monitoring: No errors detected

## Deployment Summary

**Version:** 1.2.3
**Status:** ✅ Successful
**Duration:** 4m 32s
**Rollback:** Not needed

Deployment complete! 🎉
```

### Example 2: Rollback on Failure

**User:** "Deploy version 1.2.4"

**Response:**
I'll run the deployment workflow for version 1.2.4...

```markdown
## Phase 1-4: (same as above)

## Phase 4: Production Deployment

⏱️ Deploying to production...

❌ Deployment failed: Service not responding after 60s
❌ Health checks failing

## Phase 6: Rollback

Executing rollback...
✅ Rollback to v1.2.3 successful
✅ Health checks: All passing

## Failure Analysis

**Cause:** Database migration failure
**Impact:** Service unavailable for 2m 15s
**Root Cause:** Migration script timeout

**Next Steps:**
1. Fix migration script
2. Test migration in staging
3. Retry deployment
```

## Boundaries

- Never deploy without confirmation
- Never skip health checks
- Never proceed if tests fail
- Always rollback if deployment fails
- Never deploy outside approved windows

## Deployment Checklist

Before deploying, verify:
- [ ] All tests passing
- [ ] Code reviewed and approved
- [ ] No uncommitted changes
- [ ] Dependencies verified
- [ ] Configuration checked
- [ ] Team notified
- [ ] Deployment window approved
- [ ] Rollback plan documented

## Deployment Report Template

```markdown
## Deployment Report

**Version:** [version]
**Date:** [timestamp]
**Deployer:** [name]

### Summary
[brief summary]

### Changes
- [change 1]
- [change 2]

### Verification
- [ ] Tests passing
- [ ] Health checks OK
- [ ] Smoke tests OK
- [ ] Performance OK

### Issues
[List any issues]

### Rollback
[Not needed / Executed - reason]

### Next Steps
[follow-up tasks]
```

## Error Handling

If deployment fails:
1. Stop deployment immediately
2. Assess impact
3. Execute rollback if needed
4. Document failure
5. Investigate root cause
6. Plan fix and retry

If rollback fails:
1. Alert on-call team
2. Escalate to engineering lead
3. Attempt manual intervention
4. Provide status updates

## References

```

## Skill Patterns

### Pattern 1: Query → Process → Present

For skills that retrieve and format information:

```
1. Query (find the information)
   ↓
2. Process (organize, filter, format)
   ↓
3. Present (display in structured way)
```

### Pattern 2: Analyze → Transform → Verify

For skills that modify code or data:

```
1. Analyze (understand current state)
   ↓
2. Transform (make changes)
   ↓
3. Verify (check changes are correct)
```

### Pattern 3: Check → Execute → Monitor

For skills that run processes or deployments:

```
1. Check (pre-flight checks)
   ↓
2. Execute (run the process)
   ↓
3. Monitor (watch and report)
```

### Pattern 4: Plan → Execute → Document

For skills that manage workflows:

```
1. Plan (create execution plan)
   ↓
2. Execute (follow the plan)
   ↓
3. Document (record what happened)
   ↓
4. Reflect (question approach, flag issues)
```

## Tips for Effective Skills

### Description Writing

**Good:**
```yaml
description: Update project dependencies to latest compatible versions respecting semantic versioning. Use when user asks to update packages, check for outdated libraries, or review dependency security.
```

**Bad:**
```yaml
description: Helps with dependencies.
```

### Structuring Instructions

**Good:**
```
## Workflow

### 1. Read Configuration
Clear step description...

### 2. Check Updates
Clear step description...

### 3. Apply Updates
Clear step description...
```

**Bad:**
```
Read config, check for updates, apply them.
```

### Adding Examples

**Good:**
```markdown
### Example 1: Update a Single Package

**User:** "Update react to latest"
**Response:** [Show actual command and output]
```

**Bad:**
```markdown
Just use the update command.
```

### Defining Boundaries

**Good:**
```markdown
## Boundaries

- Don't update major versions without approval
- Don't ignore test failures
- Don't update if dependencies conflict
```

**Bad:**
```markdown
Be careful with updates.
```

## See Also

- [Add Skill](/capabilities/customization/add-skill) - How to create skills
- [Skills Specification](/capabilities/skills-specification) - Complete format reference
- [Skill Execution](/capabilities/skill-execution) - How skills are used
