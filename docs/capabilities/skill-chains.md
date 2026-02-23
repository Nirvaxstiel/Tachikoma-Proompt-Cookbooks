# Skill Chains

Orchestrate multiple skills for complex workflows.

## Overview

Skill chains allow you to:

- Combine multiple skills sequentially
- Pass state between skills
- Handle errors gracefully
- Create reusable workflows
- Implement verification loops

## When to Use Skill Chains

**Use skill chains when:**
- Tasks require multiple steps
- Different domains are involved
- Verification is needed after implementation
- Workflows are reusable

**Examples:**
- "Implement and test a feature"
- "Refactor and verify code"
- "Create documentation and examples"

## Chain Structure

A skill chain is a sequence of skills with state passing:

```yaml
skill-chain:
  name: implement-verify
  skills:
    - name: code-agent
      module: architecture.md
      verify: false
      continue_on_error: false

    - name: verifier-code-agent
      module: testing-standards.md
      verify: true
      continue_on_error: true

    - name: formatter
      module: coding-standards.md
      verify: false
      continue_on_error: true
```

## State Passing

State flows between skills through:

### 1. Task List (`todowrite`)

First skill creates a task list:

```python
todowrite({
  "todos": [
    {"content": "Implement API endpoint", "status": "pending"},
    {"content": "Write tests", "status": "pending"},
    {"content": "Run tests", "status": "pending"}
  ]
})
```

Subsequent skills update the task list:

```python
todowrite({
  "todos": [
    {"content": "Implement API endpoint", "status": "completed"},
    {"content": "Write tests", "status": "in_progress"},
    {"content": "Run tests", "status": "pending"}
  ]
})
```

### 2. File Persistence

Write intermediate results:

```python
# Skill 1: Implement
file.write("implementation.json", results)

# Skill 2: Verify
results = file.read("implementation.json")
# Verify implementation
```

### 3. Plan Files

Save and load plan state:

```python
# Skill 1: Plan
plan.save_state("plan_state.json")

# Skill 2: Execute
plan = Plan.load_state("plan_state.json")
plan.execute()
```

## Error Handling

Skill chains handle errors based on configuration:

### continue_on_error: false

Chain stops on first error:

```yaml
skills:
  - name: implement
    continue_on_error: false  # Stop here on error

  - name: verify
    continue_on_error: false
```

**Result:** If `implement` fails, `verify` never runs.

### continue_on_error: true

Chain continues despite errors:

```yaml
skills:
  - name: implement
    continue_on_error: true  # Continue even if this fails

  - name: verify
    continue_on_error: true

  - name: report
    continue_on_error: true
```

**Result:** All skills run, errors are collected in final report.

## Common Chain Patterns

### 1. Implement-Verify

```yaml
implement-verify:
  skills:
    - code-agent          # Generate
    - verifier-code-agent # Verify
    - formatter           # Clean up
```

**Flow:**
1. Implement feature
2. Verify correctness
3. Format code

### 2. Research-Implement

```yaml
research-implement:
  skills:
    - research           # Explore codebase
    - planning           # Create plan
    - code               # Implement
    - verification       # Verify
```

**Flow:**
1. Research existing patterns
2. Create implementation plan
3. Execute implementation
4. Verify results

### 3. Refactor-Verify

```yaml
refactor-verify:
  skills:
    - refactor          # Refactor code
    - verification      # Verify behavior unchanged
    - tests             # Run tests
```

**Flow:**
1. Refactor code structure
2. Verify behavior unchanged
3. Run test suite

### 4. Full Pipeline

```yaml
full-pipeline:
  skills:
    - research          # Understand context
    - planning          # Create plan
    - code              # Implement
    - verification      # Verify correctness
    - tests             # Run tests
    - formatter         # Format code
    - git-commit        # Commit changes
```

**Flow:**
1. Research existing code
2. Create implementation plan
3. Write code
4. Verify correctness
5. Run tests
6. Format code
7. Commit changes

## Creating a Skill Chain

### Step 1: Define the Chain

Create `config/skill-chains.yaml`:

```yaml
my-chain:
  name: My Custom Chain
  description: Description of what this chain does
  skills:
    - skill-one
    - skill-two
    - skill-three
```

### Step 2: Configure Each Skill

```yaml
my-chain:
  skills:
    - name: code-agent
      module: architecture.md
      context:
        project: "my-project"
        branch: "main"

    - name: verification
      module: testing-standards.md
      criteria:
        - "All tests pass"
        - "Code follows standards"
```

### Step 3: Define State Passing

```yaml
my-chain:
  state:
    - task-list        # Track progress
    - plan-file        # Save/load plans
    - results-file      # Pass results
```

### Step 4: Configure Error Handling

```yaml
my-chain:
  error_handling:
    continue_on_error: true
    collect_errors: true
    on_failure: report-error
```

## Example: Complete Chain

```yaml
feature-implementation:
  name: Feature Implementation Chain
  description: Implements, tests, and commits a new feature

  skills:
    # Step 1: Research existing patterns
    - name: research
      module: architecture.md
      output: research-results.json
      continue_on_error: false

    # Step 2: Create implementation plan
    - name: planning
      module: coding-standards.md
      input: research-results.json
      output: plan.json
      continue_on_error: false

    # Step 3: Implement feature
    - name: code
      module: architecture.md
      input: plan.json
      output: implementation.json
      continue_on_error: false

    # Step 4: Verify correctness
    - name: verification
      module: testing-standards.md
      input: implementation.json
      output: verification-report.json
      verify: true
      iterations: 3
      continue_on_error: true

    # Step 5: Run tests
    - name: tests
      module: testing-standards.md
      command: npm test
      output: test-results.json
      continue_on_error: true

    # Step 6: Format code
    - name: formatter
      command: npm run format
      continue_on_error: true

    # Step 7: Commit changes
    - name: git-commit
      type: conventional
      continue_on_error: true

  state:
    - task-list          # Track progress
    - plan-file          # Save/load plans
    - results-file       # Pass results

  error_handling:
    continue_on_error: true
    collect_errors: true
    final_report: implementation-summary.json
```

## Running a Skill Chain

Skill chains are invoked through intent routing:

```yaml
routes:
  implement:
    patterns:
      - "implement.*feature"
      - "add.*functionality"
    confidence_threshold: 0.7
    skill_chain: feature-implementation
    strategy: sequential
```

**User:** "Implement user authentication"

**Execution:**
1. Intent classified as `implement`
2. Route to `feature-implementation` chain
3. Execute skills sequentially
4. Generate final report

## Best Practices

### For Chain Authors

1. **Break down logically** — Each skill should have clear purpose
2. **Define state passing** — Specify how data flows between skills
3. **Handle errors gracefully** — Configure `continue_on_error` appropriately
4. **Verify at the end** — Final skill should validate entire chain
5. **Document dependencies** — State which skills require which inputs

### For Users

1. **Understand the chain** — Know what each step does
2. **Review intermediate results** — Check outputs between skills
3. **Handle errors** — Review error reports if chain fails
4. **Iterate if needed** — Re-run chain or individual skills

## Research

This feature is based on research from:

- **Modularity** — "Agentic Proposing" (arXiv:2602.03279)
  - Finding: Modular components beat monolithic approaches
  - Implication: Use focused skills, not all-in-one agents

[Learn more about modularity →](../research/modularity.md)

## See Also

- [Skill Execution](./skill-execution.md) — Individual skill usage
- [Intent Routing](./intent-routing.md) — How chains are selected
- [PAUL Methodology](./paul-methodology.md) — Structured planning
- [Verification Loops](../research/verification-loops.md) — Quality verification
