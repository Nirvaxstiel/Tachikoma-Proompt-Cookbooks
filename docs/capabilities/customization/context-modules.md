# Context Modules

Configure project-specific rules and conventions for Tachikoma.

## Overview

Context modules define how your project works — coding standards, workflow patterns, architecture decisions, and team conventions. Tachikoma loads them by priority so you don't have to explain your conventions every time.

### Why Context Modules?

**Without context modules:**
- You must explain conventions for every request
- AI might make incorrect assumptions
- Inconsistent behavior across sessions
- Higher token usage (repeating instructions)

**With context modules:**
- Project rules are always available
- AI understands your conventions automatically
- Consistent behavior every time
- Lower token usage (load once, use many times)

### How Context Modules Work

1. **Intent Classification:** Tachikoma determines what you want to do
2. **Route Lookup:** Finds which route matches the intent
3. **Module Loading:** Loads context modules specified in the route
4. **Module Ordering:** Loads by priority (lower numbers first)
5. **Context Injection:** All loaded modules are injected into the agent's context
6. **Execution:** Agent follows rules from loaded modules
7. **Reflection:** After execution, question if context was sufficient

## Available Modules

### Built-in Modules

| Module | Priority | Purpose | When Loaded |
|--------|----------|---------|-------------|
| `00-core-contract` | 0 | Universal rules (ALWAYS first) | Every task |
| `10-coding-standards` | 10 | Code style and design patterns | Coding tasks (implement/debug/review/refactor) |
| `11-artifacts-policy` | 11 | Artifact consent and workspace protection | Every task |
| `12-commenting-rules` | 12 | Comment guidelines | Coding tasks (coupled with coding-standards) |
| `20-git-workflow` | 20 | Git conventions | Git operations |
| `30-research-methods` | 30 | Investigation methodology | Research tasks |
| `50-prompt-safety` | 50 | Safety frameworks | All tasks (when safety is a concern) |

### Priority System

**Lower numbers load first.** The spacing (0, 10, 12, 20, 30, 50) leaves room for your custom modules.

**Custom module range:** 40-49
- 40: Your coding conventions
- 41: Your workflow rules
- 42: Your tooling preferences
- 43: Your testing conventions
- 44: Your deployment rules
- 45: Your architecture patterns
- 46-49: Reserved for future use

## Creating Custom Modules

### Step 1: Create Module File

Create a new file in `.opencode/context-modules/`:

```bash
touch .opencode/context-modules/40-my-project-rules.md
```

### Step 2: Module Frontmatter

Every context module must have YAML frontmatter:

```yaml
---
module_id: my-project-rules
name: My Project Rules
priority: 40
version: "1.0"
---
```

#### Frontmatter Fields

| Field | Required | Description |
|-------|----------|-------------|
| `module_id` | Yes | Unique identifier (lowercase, hyphens) |
| `name` | Yes | Human-readable name |
| `priority` | Yes | Load order (0-99, lower = first) |
| `version` | No | Version of this module |

### Step 3: Module Content

Add your project rules and conventions:

```markdown
# My Project Rules

## Testing
Always run `npm test` before committing. If tests fail, don't push.

## Code Style
- Use 2-space indentation
- Components: PascalCase
- Utils: camelCase
- No trailing whitespace
- Max line length: 80 characters

## Architecture
- Components in `src/components/`
- Utils in `src/utils/`
- No circular dependencies
- Export types from `src/types/`
```

## Complete Module Examples

### Example 1: React Project Rules

```yaml
---
module_id: react-project-standards
name: React Project Standards
priority: 40
version: "1.0"
---
```

```markdown
# React Project Standards

## Component Structure

### File Organization
```
src/
├── components/
│   ├── common/          # Shared, reusable components
│   │   ├── Button.tsx
│   │   ├── Input.tsx
│   │   └── index.ts
│   ├── features/        # Feature-specific components
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   └── index.ts
│   │   └── dashboard/
│   └── layouts/         # Layout components
│       ├── Header.tsx
│       └── Sidebar.tsx
├── hooks/               # Custom hooks
├── utils/               # Utility functions
├── types/               # TypeScript types
└── constants/          # Constants and configs
```

### Component Guidelines

**Functional Components Only**
- Use functional components with hooks
- No class components
- Use `React.FC` for typed components

**Component Names**
- PascalCase for components: `UserProfile.tsx`
- Prefix with feature name for feature components: `AuthLoginForm.tsx`

**Props**
- Define props interface before component
- Use `interface` for component props (not `type`)
- Export props interface for reuse
```tsx
interface ButtonProps {
  label: string
  onClick: () => void
  variant?: 'primary' | 'secondary'
  disabled?: boolean
}

export const Button: React.FC<ButtonProps> = ({
  label,
  onClick,
  variant = 'primary',
  disabled = false
}) => {
  // Component logic
}
```

**State Management**
- Use `useState` for local component state
- Use `useReducer` for complex state logic
- Use context/zustand for global state
- Avoid prop drilling beyond 2-3 levels

**Side Effects**
- Use `useEffect` for side effects
- Always include dependency array
- Clean up effects with return function
```tsx
useEffect(() => {
  const subscription = subscribe()
  return () => subscription.unsubscribe()
}, [dependency])
```

### Hooks

**Custom Hooks**
- Prefix with `use`: `useAuth`, `useData`
- Place in `src/hooks/`
- Export from `src/hooks/index.ts`
```tsx
// src/hooks/useAuth.ts
export const useAuth = () => {
  const [user, setUser] = useState(null)
  // Hook logic
  return { user, login, logout }
}
```

### Styling

**CSS Modules**
- Use CSS Modules for component styles
- Name file: `ComponentName.module.css`
- Import styles: `import styles from './ComponentName.module.css'`

**Tailwind CSS**
- Use utility classes for styling
- Keep custom CSS to minimum
- Group related classes

### TypeScript

**Type Definitions**
- Use `interface` for object shapes
- Use `type` for unions and primitives
- Export types from `src/types/`
```tsx
// src/types/user.ts
export interface User {
  id: string
  name: string
  email: string
}

export type UserRole = 'admin' | 'user' | 'guest'
```

**Strict Mode**
- Enable strict TypeScript
- No implicit `any`
- All files must have imports/exports
- Use `strictNullChecks`

### Performance

**Optimization Rules**
- Use `React.memo()` for expensive components
- Use `useMemo()` for expensive calculations
- Use `useCallback()` for stable function references
- Lazy load routes with `React.lazy()`
- Code split at route level

**Avoid**
- Inline function props (creates new functions on every render)
- Inline object props (creates new objects on every render)
- Unnecessary re-renders

### Testing

**Test Organization**
- Co-locate tests with components: `Button.test.tsx`
- Use `jest` and `@testing-library/react`
- Test behavior, not implementation
- Write unit tests for utils
- Write integration tests for features

**Test Requirements**
- Test happy path
- Test error paths
- Test edge cases
- Test user interactions
- Minimum 80% coverage

## Tools

### Linting
- ESLint with Airbnb or Standard config
- Prettier for code formatting
- Husky for pre-commit hooks

### Build
- Use `npm run build` for production builds
- Verify build output before deployment
- Check bundle size with `npm run analyze`

### Development
- Use `npm run dev` for local development
- Use `npm run lint` to check code quality
- Use `npm run test` to run tests
- Use `npm run test:watch` for test-driven development
```

### Example 2: Python Project Rules

```yaml
---
module_id: python-project-standards
name: Python Project Standards
priority: 41
version: "1.0"
---
```

```markdown
# Python Project Standards

## Project Structure

```
myproject/
├── src/
│   ├── __init__.py
│   ├── api/              # API endpoints
│   │   ├── __init__.py
│   │   └── endpoints.py
│   ├── models/           # Data models
│   │   ├── __init__.py
│   │   └── user.py
│   ├── services/         # Business logic
│   │   ├── __init__.py
│   │   └── auth.py
│   ├── utils/            # Utilities
│   │   ├── __init__.py
│   │   └── helpers.py
│   └── config.py         # Configuration
├── tests/                # Tests
│   ├── __init__.py
│   ├── test_api.py
│   ├── test_models.py
│   └── test_services.py
├── requirements.txt       # Dependencies
├── requirements-dev.txt   # Dev dependencies
├── setup.py             # Package setup
├── pytest.ini           # pytest config
└── .env.example         # Environment template
```

## Code Style

### PEP 8 Compliance
- Follow PEP 8 guidelines
- Use `black` for code formatting
- Use `flake8` for linting
- Use `isort` for import sorting

### Naming Conventions
- **Variables/Functions:** snake_case: `user_name`, `get_user()`
- **Classes:** PascalCase: `UserManager`, `AuthService`
- **Constants:** UPPER_SNAKE_CASE: `MAX_RETRIES`, `API_URL`
- **Private:** Leading underscore: `_internal_method`

### Import Style
```python
# Standard library imports
import os
import sys

# Third-party imports
import requests
from fastapi import FastAPI

# Local imports
from src.models.user import User
from src.services.auth import AuthService
```

## Type Hints

**Always Use Type Hints**
```python
from typing import List, Optional, Dict

def get_users(limit: int = 10) -> List[User]:
    """Get list of users."""
    return users[:limit]

def get_user(user_id: str) -> Optional[User]:
    """Get user by ID or None if not found."""
    return next((u for u in users if u.id == user_id), None)

def create_user(data: Dict[str, str]) -> User:
    """Create new user from data dict."""
    return User(**data)
```

## Classes

**Class Structure**
```python
class UserService:
    """Service for user operations."""

    def __init__(self, db: Database):
        """Initialize with database connection."""
        self.db = db

    def get_user(self, user_id: str) -> Optional[User]:
        """Get user by ID."""
        pass

    def create_user(self, user: User) -> User:
        """Create new user."""
        pass
```

**Guidelines**
- Use type hints for all methods
- Include docstrings for all classes and methods
- Keep classes focused on single responsibility
- Use dependency injection

## Error Handling

**Exception Hierarchy**
```python
class AppError(Exception):
    """Base application error."""
    pass

class UserNotFoundError(AppError):
    """User not found error."""
    pass

class ValidationError(AppError):
    """Validation error."""
    pass

# Usage
try:
    user = get_user(user_id)
except UserNotFoundError:
    logger.error(f"User {user_id} not found")
    raise
```

## Testing

**Test Structure**
```python
# tests/test_user_service.py
import pytest
from src.services.user import UserService
from src.models.user import User

@pytest.fixture
def user_service(db):
    """Create user service fixture."""
    return UserService(db)

def test_get_user(user_service, sample_user):
    """Test getting user."""
    result = user_service.get_user(sample_user.id)
    assert result == sample_user

def test_get_user_not_found(user_service):
    """Test getting non-existent user."""
    result = user_service.get_user("non-existent")
    assert result is None
```

**Testing Guidelines**
- Use `pytest` as test framework
- Write unit tests for all functions
- Mock external dependencies
- Test both success and error cases
- Aim for 80%+ coverage

## Logging

**Logging Setup**
```python
import logging

logger = logging.getLogger(__name__)

def get_user(user_id: str) -> Optional[User]:
    """Get user by ID."""
    logger.info(f"Fetching user: {user_id}")
    try:
        user = db.get_user(user_id)
        logger.debug(f"Found user: {user}")
        return user
    except DatabaseError as e:
        logger.error(f"Failed to fetch user: {e}")
        raise
```

## Environment Variables

**Configuration**
```python
# src/config.py
from pydantic import BaseSettings

class Settings(BaseSettings):
    """Application settings."""

    app_name: str = "MyApp"
    debug: bool = False
    database_url: str
    secret_key: str

    class Config:
        env_file = ".env"

settings = Settings()
```

## Dependencies

**Requirements Files**
- `requirements.txt`: Production dependencies
- `requirements-dev.txt`: Development dependencies

**Pin Versions**
```
requests==2.28.1
fastapi==0.85.0
uvicorn==0.19.0
```

## Tools

**Development**
- `black`: Code formatting
- `flake8`: Linting
- `isort`: Import sorting
- `mypy`: Type checking
- `pytest`: Testing
- `pytest-cov`: Coverage

**Commands**
```bash
# Format code
black src/

# Lint code
flake8 src/

# Sort imports
isort src/

# Type check
mypy src/

# Run tests
pytest

# Run tests with coverage
pytest --cov=src --cov-report=html
```
```

### Example 3: Workflow Rules

```yaml
---
module_id: workflow-conventions
name: Workflow Conventions
priority: 42
version: "1.0"
---
```

```markdown
# Workflow Conventions

## Branching Strategy

### Branch Naming
- `feature/ticket-description`: New features
- `bugfix/ticket-description`: Bug fixes
- `hotfix/ticket-description`: Critical production fixes
- `refactor/ticket-description`: Refactoring
- `docs/ticket-description`: Documentation updates

**Examples:**
- `feature/ABC-123-add-user-authentication`
- `bugfix/ABC-456-fix-login-crash`
- `hotfix/ABC-789-memory-leak`

### Branch Lifecycle

1. **Create Branch**
   ```bash
   git checkout -b feature/ABC-123-description
   ```

2. **Make Changes**
   - Write code following standards
   - Add tests
   - Update documentation

3. **Commit Changes**
   - Follow commit message convention
   - Keep commits atomic
   - Reference ticket number

4. **Push Branch**
   ```bash
   git push origin feature/ABC-123-description
   ```

5. **Create Pull Request**
   - Title: `[ABC-123] Description`
   - Link to ticket
   - Assign reviewers
   - Request review

6. **Review and Merge**
   - At least one approval required
   - All checks must pass
   - Squash and merge into main

## Commit Messages

### Format
```
<type>(<scope>): <subject>

<body>

<footer>
```

### Types
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Adding or updating tests
- `chore`: Maintenance tasks

### Examples

**Good:**
```
feat(auth): add OAuth2 authentication support

- Add Google OAuth provider
- Add GitHub OAuth provider
- Update login page

Closes #123
```

```
fix(api): resolve null reference error in user endpoint

Issue was caused by missing user profile check.
Added defensive programming.

Fixes #456
```

**Bad:**
```
Fixed bug
Update
WIP
```

## Code Review

### Review Checklist
- [ ] Code follows project standards
- [ ] Tests are added/updated
- [ ] Documentation is updated
- [ ] No new TODOs (with explanation)
- [ ] No console.log/print statements
- [ ] No commented-out code
- [ ] No hardcoded secrets
- [ ] Performance is acceptable
- [ ] Error handling is in place

### Review Feedback Guidelines
**Giving Feedback:**
- Be constructive and specific
- Explain the "why"
- Provide code examples
- Respect tone and language

**Receiving Feedback:**
- Ask for clarification if needed
- Explain your reasoning
- Be open to suggestions
- Don't take it personally

## Pull Request Process

### PR Template
```markdown
## Description
[Brief description of changes]

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Breaking change
- [ ] Documentation update

## Related Issue
Closes #[ticket-number]

## How to Test
[Instructions for testing]

## Checklist
- [ ] Tests pass locally
- [ ] Code follows standards
- [ ] Documentation updated
- [ ] No new warnings
- [ ] Self-review completed
```

### PR Rules
- One PR per ticket
- Small, focused PRs (< 500 lines)
- Squash commits before merge
- Delete branch after merge
- Never merge own PR without approval

## Release Process

### Version Bumping
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes

### Release Checklist
- [ ] All tests passing
- [ ] Documentation updated
- [ ] CHANGELOG updated
- [ ] Version bumped
- [ ] Tag created: `git tag v1.2.3`
- [ ] Tag pushed: `git push origin v1.2.3`
```

## Using Context Modules

### In Intent Routes

Reference your custom modules in route definitions:

```yaml
routes:
  debug:
    description: Fix issues and errors
    confidence_threshold: 0.7
    context_modules:
      - 00-core-contract
      - 10-coding-standards
      - 12-commenting-rules
      - 40-my-project-rules     # Your custom rules
    skill: code-agent
```

### Dynamic Loading

Tachikoma loads modules based on:
1. **Intent classification** (what type of task)
2. **Route configuration** (which modules match this intent)
3. **Priority order** (lower numbers first)

**Example flow:**
```
User: "Fix the authentication bug"
    ↓
Intent: debug (confidence: 0.95)
    ↓
Route: debug (skill: code-agent)
    ↓
Context Modules:
    1. 00-core-contract (always)
    2. 10-coding-standards
    3. 12-commenting-rules (coupled with coding-standards)
    4. 40-my-project-rules (custom)
    ↓
Load all modules into context
    ↓
Execute with loaded rules
```

## Context Coupling

Some modules are coupled — if you load one, Tachikoma automatically loads the other:

### Built-in Couplings

| Module | Coupled With | Reason |
|--------|--------------|--------|
| `10-coding-standards` | `12-commenting-rules` | Coding tasks need both style and comment rules |
| `11-artifacts-policy` | Applies to all skills | Artifact consent applies to all skills that create files |

### Custom Couplings

You can define custom couplings in `intent-routes.yaml`:

```yaml
module_coupling:
  40-my-project-rules:
    must_co_load:
      - 41-workflow-rules
    reason: "Project rules and workflow rules are inseparable"
```

## Best Practices

### ✅ DO

1. **Keep modules focused**
   - One concern per module
   - Clear separation of concerns
   - Specific, actionable rules

2. **Use appropriate priority**
   - Respect the spacing
   - Don't interfere with built-in modules
   - Group related modules together

3. **Test with real tasks**
   - Verify rules work as expected
   - Get feedback from team
   - Iterate based on usage

4. **Document clearly**
   - Explain why rules exist
   - Provide examples
   - Link to external resources

### ❌ DON'T

1. **Don't modify core modules**
   - Create custom ones instead
   - Core modules are universal
   - Custom modules are project-specific

2. **Don't make modules too large**
   - Split into multiple modules if needed
   - Keep under 500 lines
   - Use progressive disclosure

3. **Don't duplicate rules**
   - Check existing modules first
   - Reuse when possible
   - Only add unique rules

4. **Don't ignore priority**
   - Priority matters for loading order
   - Use correct priority range
   - Document priority decisions

## Troubleshooting

| Problem | Fix |
|---------|-----|
| Module not loading | Check priority and naming |
| Rules not being followed | Check module syntax and clarity |
| Conflicting rules | Remove or clarify conflicts |
| Module too large | Split into multiple modules |

## See Also

- [Context Management](/capabilities/context-management) - How context loading works
- [Customization Overview](/capabilities/customization/overview) - Other customization options
- [Add Intent](/capabilities/customization/add-intent) - How to reference modules in routes
