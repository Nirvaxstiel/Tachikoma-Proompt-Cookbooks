# Changelog Draft

**For dev use only** - This file tracks ongoing work.

---

## [DEV] - Current

### Added
- Add TypeScript CLI tools (router, spec-setup, state-update, unify)
- Add 6 Tachikoma slash commands for workflow management
- Add code-review skill with priority classification
- Add PR skill for pull request descriptions
- Add security-audit skill for OWASP-based vulnerability assessment
- Add workflow-management skill for 7-phase development
- Add RLM TypeScript plugin v2.0
- Add shared shell/batch utilities for consistent formatting
- Add context economics principles to core-contract
- Add UNIFY phase as mandatory task closure
- Add spec session folder structure with BDD acceptance criteria
- Add npm installer and update docs
- Add verification-engine to TypeScript
- Add changelogs and workflow documentation
- Add git-diff-analysis composite intent for automatic changelog/commit scanning

### Changed
- Split review intent into review-general and code-review
- Split complex into complex-large-context and complex-workflow
- Update .gitignore for Bun runtime and simplified structure
- Update agent documentation with 8-phase workflow
- Update core-contract version 2.2.0 → 2.3.0
- Update RLM documentation for TypeScript REPL
- Update intent routes with functional-thinking context module
- Update config file references for edit-format-selector.ts
- Update all references from Python to TypeScript
- Update tachikoma.md with hybrid execution model and git-diff-analysis routing
- Update artifact policy v1.2.0 → v1.3.0 with approved workflows clarification and pre-action validation

### Fixed
- Fix duplicate log function definitions in tachikoma-install.sh
- Fix comment removal in Python scripts
- Fix path references in archived Python files
- Fix inconsistent code formatting in utilities
- Fix shebang and encoding issues in Python files
- Fix align ASCII art box borders
- Fix skip prompt when using -c, show current directory
- Fix update model-aware-editor Python references to TypeScript
- Fix add import.meta.main guards to RLM TypeScript modules
- Fix update gitignore, remove binary/site-packages from tracking

### Removed
- Remove duplicate print functions in shell scripts
- Remove hardcoded color definitions in favor of shared utilities
- Remove redundant comment blocks
- Remove old skill files (archived to _archive)
- Remove Python CLI router (replaced by TypeScript)
- Remove thin shell wrappers
- Remove Python dependency from RLM plugin
- Remove unused Python/shell scripts
- Remove binary Python runtime files from tracking

### Refactored
- Migrate Python RLM REPL to TypeScript with Bun runtime
- Refactor shell scripts to use shared shell-utils.sh
- Refactor batch files to use shared batch-utils.bat
- Reorganize .opencode structure with agents/tachikoma/ subdirectory
- Archive Python files to _archive/old-skills-py/
- Deduplicate utilities into shared Python modules
- Reorganize RLM plugin architecture for native integration
- Standardize template system for CLI tools
- Convert edit-format-selector and compression-evaluator to TypeScript
- Change Python code blocks to pseudocode in documentation

### Chores
- Update documentation for TypeScript conversion
- Create SHELL_REFACTORING_GUIDE for migration reference
- Update skill documentation with TypeScript examples
- Add comprehensive CHANGELOG documentation structure
- Standardize configuration file locations
- Update version numbers across documentation
- Simplify root gitignore
- Clean up gitignore, remove assets from tracking

---

## How to Use

1. Add: `.opencode/scripts/changelog.sh add "+ Added new feature"`
2. Show: `.opencode/scripts/changelog.sh show`
3. Release: `.opencode/scripts/changelog.sh release v0.2.0`
