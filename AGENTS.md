---
# DI Registry Configuration
# This file defines the Dependency Injection-style Context Module System
# Version: 2.0.0

registry_version: "2.0.0"
project_name: "Tachikoma Context System"
last_updated: "2026-02-03"

# ============================================
# CORE MODULES (Always Loaded)
# ============================================
core_modules:
  - module_id: core-contract
    name: Core Operating Contract
    file: .opencode/modules/00-core-contract.md
    priority: 0
    type: core
    description: Non-negotiable foundational rules
    always_loaded: true
    exports:
      - externalized_context_mode
      - execution_loop
      - precedence_rules
      - minimal_change_principle
      - validation_before_action
      - stop_conditions
      - reuse_before_creation

# ============================================
# CONTEXT MODULES (Loaded Based on Intent)
# ============================================
context_modules:
  - module_id: coding-standards
    name: Coding Standards & Design Philosophy
    file: .opencode/modules/10-coding-standards.md
    priority: 10
    type: context
    description: Design primitives and code style guidelines
    depends_on:
      - core-contract
    exports:
      - design_primitives
      - code_style_bias
      - tooling_philosophy
      - validation_expectations

  - module_id: commenting-rules
    name: Commenting Culture & Rules
    file: .opencode/modules/15-commenting-rules.md
    priority: 15
    type: context
    description: Minimal commenting philosophy - strict enforcement
    depends_on:
      - core-contract
      - coding-standards
    exports:
      - comment_philosophy
      - prohibited_patterns
      - required_patterns
      - the_comment_test
      - violation_response

  - module_id: git-workflow
    name: Git Workflow & Conventions
    file: .opencode/modules/20-git-workflow.md
    priority: 20
    type: context
    description: Git operations and version control best practices
    depends_on:
      - core-contract
    exports:
      - commit_conventions
      - branch_patterns
      - validation_commands
      - git_safety_rules

  - module_id: delegation-patterns
    name: Delegation Patterns & Subagent Usage
    file: .opencode/modules/25-delegation-patterns.md
    priority: 25
    type: context
    description: When and how to invoke subagents via Task tool
    depends_on:
      - core-contract
    exports:
      - when_to_delegate
      - available_agents
      - delegation_rules
      - task_permissions

  - module_id: research-methods
    name: Research Methods & Investigation
    file: .opencode/modules/30-research-methods.md
    priority: 30
    type: context
    description: Evidence-driven research and source evaluation
    depends_on:
      - core-contract
    exports:
      - framing_methodology
       - source_evaluation
       - confidence_labeling
       - synthesis_rules
 
  - module_id: workflow-management
    name: Spec-Driven Workflow Management
    file: .opencode/modules/35-workflow-management.md
    priority: 35
    type: context
    description: Production-grade 6-phase development workflow with quality gates, confidence-based adaptation, and automated technical debt tracking.
    depends_on:
      - core-contract
      - coding-standards
    exports:
      - six_phase_workflow
      - confidence_based_adaptation
      - quality_gates
      - technical_debt_automation
      - documentation_templates

  - module_id: task-tracking
    name: Progressive Task Tracking System
    file: .opencode/modules/40-task-tracking.md
    priority: 40
    type: context
    description: Three-file progressive tracking system (plan/details/changes) with MANDATORY updates and divergent-change logging for accountability.
    depends_on:
      - core-contract
      - coding-standards
      - workflow-management
    exports:
      - three_file_tracking_system
      - mandatory_update_protocol
      - divergent_change_tracking
      - release_summary_format

  - module_id: agent-orchestration
    name: Agent Orchestration & Handoffs
    file: .opencode/modules/45-agent-orchestration.md
    priority: 45
    type: context
    description: Sequential agent workflows with handoffs, wrapper prompts for sub-agent invocation, dynamic parameters, and tool delegation ceilings.
    depends_on:
      - core-contract
      - coding-standards
      - delegation-patterns
    exports:
      - agent_handoffs_configuration
      - sub_agent_wrapper_pattern
      - dynamic_parameters_system
      - tool_delegation_management

  - module_id: prompt-safety
    name: Prompt Engineering Safety & Compliance
    file: .opencode/modules/50-prompt-safety.md
    priority: 50
    type: context
    description: Comprehensive prompt engineering best practices, safety frameworks, bias mitigation, and responsible AI usage with checklists and red-teaming protocols.
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
 
 # ============================================
 # INTENT → MODULE BUNDLES
 # ============================================
 intent_bundles:
  debug:
    description: Finding and fixing issues, troubleshooting
    primary_intent: debugging
    confidence_threshold: 0.7
    modules:
      - core-contract
      - coding-standards
    skills:
      - code-agent
    tools:
      - Read
      - Grep
      - Bash
    strategy: direct

  implement:
    description: Writing or modifying code, adding features
    primary_intent: implementation
    confidence_threshold: 0.7
    modules:
      - core-contract
      - coding-standards
      - commenting-rules
    skills:
      - code-agent
    tools:
      - Read
      - Write
      - Edit
      - Bash
    strategy: direct

  review:
    description: Analyzing code for quality, auditing
    primary_intent: analysis
    confidence_threshold: 0.7
    modules:
      - core-contract
      - coding-standards
      - delegation-patterns
    skills:
      - analysis-agent
    tools:
      - Read
      - Grep
      - Analysis
    strategy: direct

  research:
    description: Finding information, investigating
    primary_intent: investigation
    confidence_threshold: 0.6
    modules:
      - core-contract
      - research-methods
    skills:
      - research-agent
    tools:
      - Read
      - WebFetch
      - Grep
    strategy: direct

  git:
    description: Version control operations, commits, PRs
    primary_intent: version_control
    confidence_threshold: 0.8
    modules:
      - core-contract
      - git-workflow
    skills:
      - git-commit
      - pr
    tools:
      - Bash
    strategy: direct

  document:
    description: Creating or updating documentation
    primary_intent: documentation
    confidence_threshold: 0.6
    modules:
      - core-contract
      - commenting-rules
    skills:
      - self-learning
    tools:
      - Read
      - Write
    strategy: direct

  complex:
    description: Multi-step tasks, large context processing
    primary_intent: complex_processing
    confidence_threshold: 0.5
    modules:
      - core-contract
      - delegation-patterns
    skills: []
    agents:
      - rlm-subcall
    tools:
      - Read
    strategy: rlm

# ============================================
# COMPOSITE INTENTS
# ============================================
composite_intents:
  enabled: true
  resolution_strategy: union
  
  definitions:
    - name: implement-and-test
      components:
        - implement
        - debug
      description: Write code and verify it works
      module_resolution: union
    
    - name: research-and-implement
      components:
        - research
        - implement
      description: Investigate then implement solution
      module_resolution: union
    
    - name: refactor-and-test
      components:
        - implement
        - debug
      description: Refactor code with verification
      module_resolution: union

# ============================================
# RUNTIME CONFIGURATION
# ============================================
runtime:
  # How often to check and reload modules
  check_interval: every_message
  
  # Whether to report loaded modules
  report_loaded: true
  
  # Reporting style: compact, detailed, or silent
  report_format: compact
  
  # Whether to auto-reload when intent changes
  auto_reload_on_intent_change: true
  
  # Core modules stay loaded (sticky), context modules reload
  sticky_core: true
  
  # Dependency resolution strategy
  dependency_resolution: automatic
  
  # Intent detection settings
  intent_detection:
    primary_source: intent_lookup.yaml
    fallback: keyword_matching
    composite_enabled: true
    
  # Module retention policy
  retention:
    core_modules: persistent
    context_modules: intent_based
    unload_unused_after: null

# ============================================
# SELF-LEARNING CONFIGURATION
# ============================================
self_learning:
  enabled: true
  
  # What triggers learning
  triggers:
    - type: pattern_recurrence
      count: 3
      window: 10_turns
      description: "Same user reminder given 3 times in 10 turns"
    
    - type: confidence_drop
      threshold: 0.5
      description: "Agent confidence drops below 0.5"
    
    - type: explicit_user_signal
      patterns:
        - "learn this"
        - "remember this"
        - "add this rule"
        - "this should be a rule"
      description: "User explicitly asks to learn a pattern"
  
  # What actions learning can propose
  actions:
    propose_new_modules:
      enabled: true
      approval_required: true
      description: "Create new context module for discovered pattern"
    
    propose_module_updates:
      enabled: true
      approval_required: true
      description: "Update existing module with refined rules"
    
    propose_intent_mappings:
      enabled: true
      approval_required: true
      description: "Add new intent or modify intent bundles"
    
    propose_tool_bindings:
      enabled: true
      approval_required: false
      description: "Auto-discover and bind project-specific tools"
  
  # Confidence thresholds
  confidence_thresholds:
    propose_new: 0.7
    auto_apply_low_risk: 0.9
  
  # Auto-apply rules (no approval needed)
  auto_apply:
    - typo_fixes
    - formatting_updates
    - tool_bindings

# ============================================
# TOOL DISCOVERY
# ============================================
tool_discovery:
  enabled: true
  
  sources:
    - name: project_files
      description: "Scan project config files for validation commands"
      files_to_check:
        - pyproject.toml
        - package.json
        - requirements.txt
        - Cargo.toml
        - Makefile
        - justfile
      
    - name: usage_patterns
      description: "Observe which commands are frequently used"
      observation_window: 20_turns
      
    - name: user_explicit
      description: "User directly tells us about tools"
      trigger_phrases:
        - "use this command"
        - "run this to validate"
        - "the test command is"
  
  update_target: modules
  target_modules:
    - git-workflow
    - coding-standards

# ============================================
# REPORTING TEMPLATES
# ============================================
reporting:
  compact_template: "Loaded: {modules}"
  detailed_template: "Intent: {intent} | Loaded: {core_modules} (core), {context_modules} (context)"
  module_icon: "📦"
  core_icon: "🔒"
  context_icon: "📄"

---

# Tachikoma Context System - AGENTS.md

## System Overview

This project uses a **Dependency Injection-style Context Module System**. 

**How it works:**
1. **Every message**: System detects your intent
2. **Resolves**: Which context modules are needed
3. **Loads**: Core modules (always) + Context modules (task-specific)
4. **Reports**: Shows you what's loaded
5. **Executes**: Your request with full context

**Key benefits:**
- ✅ **No more forgetting**: Modules reload every turn automatically
- ✅ **No magic words**: Context loads based on what you're doing
- ✅ **Self-improving**: System learns from patterns and proposes improvements
- ✅ **Transparent**: You see exactly what's guiding the agent

---

## Quick Commands

### Check what's loaded:
```
"What modules are active?"
"Show me the loaded context"
```

### Force reload:
```
"Reload context"
"Refresh modules"
"Re-read AGENTS.md"
```

### See specific module:
```
"Show me the commenting rules"
"What does the git workflow module say?"
```

### Teach the system:
```
"Learn this: [new rule or pattern]"
"Remember this for future"
"This should be added to the [module]"
```

---

## Intent Quick Reference

| Intent | When Used | Modules Loaded |
|--------|-----------|----------------|
| **Implement** | Writing/modifying code | core + coding + commenting |
| **Debug** | Finding/fixing issues | core + coding |
| **Research** | Investigation, finding info | core + research |
| **Review** | Code analysis, auditing | core + coding + delegation |
| **Git** | Version control | core + git |
| **Document** | Writing docs | core + commenting |
| **Complex** | Large tasks | core + delegation → rlm-subcall |

---

## Available Modules

### Core (Always Loaded)
- **00-core-contract** - Foundational rules, precedence, minimal change

### Context (Loaded by Intent)
- **10-coding-standards** - Design primitives, patterns, style
- **15-commenting-rules** - Minimal commenting philosophy ⭐
- **20-git-workflow** - Git conventions, validation commands
- **25-delegation-patterns** - When/how to use subagents
- **30-research-methods** - Research, source evaluation

---

## Special Focus: Commenting Rules

**⚠️ This is the most commonly violated rule set.**

**Core Philosophy:**
> Code explains "what"; comments explain "why"

**Remember:**
- ❌ NEVER explain loops, types, or obvious code
- ❌ NEVER leave TODOs in committed code
- ❌ NEVER comment what the code already shows
- ✅ ALWAYS explain business rules and non-obvious decisions
- ✅ ALWAYS try refactoring before adding a comment

**If I remind you about comments:**
→ **Immediately re-read the 15-commenting-rules module**
→ Apply strict enforcement
→ Review your previous output for violations

---

## Self-Learning System

The system **learns from your feedback**:

### Auto-Detection (Pattern-Based)
- If you repeat the same reminder 3 times → Proposes new rule
- If confidence repeatedly drops → Suggests module update
- If you explicitly say "learn this" → Creates proposal

### What Gets Proposed
1. **New modules** - For patterns not covered (requires approval)
2. **Module updates** - Refinements to existing rules (requires approval)
3. **Intent mappings** - New task types (requires approval)
4. **Tool bindings** - Auto-discovered validation commands (auto-applied)

### Approval Required
- ✅ You always approve structural changes
- ✅ You always approve new modules
- ⚡ Tool discoveries auto-apply (low risk)

---

## Module Contract

**Every module enforces specific behaviors.**

When a module is loaded, you **must**:
1. Follow all rules in that module
2. Apply the specified patterns
3. Respect the defined constraints
4. Stop when stop conditions are met

**Violations:**
- Assuming context without inspection (violates core-contract)
- Over-commenting (violates commenting-rules)
- Committing without validation (violates git-workflow)
- Delegating simple tasks (violates delegation-patterns)

---

## Dependency Resolution

Modules resolve dependencies automatically:

```
core-contract (priority 0)
  ↓
coding-standards (priority 10) - depends on core
  ↓
commenting-rules (priority 15) - depends on core + coding
```

**You don't manage this** - the system resolves and loads in correct order.

---

## Composite Intents

Some tasks span multiple intents:

- **"Add a feature and test it"** → implement + debug
- **"Research this API then use it"** → research + implement
- **"Refactor and make sure it works"** → implement + debug

**System handles this:**
- Detects multiple intents
- Loads union of required modules
- Reports: "Composite: implement-and-test"

---

## For Developers

### Adding a New Module

1. Create file: `.opencode/modules/XX-name.md`
2. Add YAML frontmatter with module_id, priority, depends_on
3. Define exports (what the module provides)
4. Write clear, enforceable rules
5. Add to intent_bundles in this file
6. Test with a real task

### Module Template

```markdown
---
module_id: your-module
name: Your Module Name
priority: 35
depends_on:
  - core-contract
exports:
  - rule_1
  - rule_2
---

# Your Rules

## Core Principle
Clear, memorable statement.

## Specific Rules
- Do X
- Don't do Y

## Examples
Good vs Bad examples.

## Violation Response
What to do if user reminds you.
```

---

## Final Rule

**When in doubt:**
> Re-read the relevant module, downgrade confidence, or ask explicitly.

**The system is designed to:**
- Keep you on track automatically
- Learn from your corrections
- Never require "magic words"
- Always show you what's guiding decisions
