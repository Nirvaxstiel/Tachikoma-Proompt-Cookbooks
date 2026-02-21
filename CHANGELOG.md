# Changelog

All notable changes to Tachikoma will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [0.1.0] - 2026-02-21

### Added
- **Tachikoma Dashboard** - New interactive UI for session visualization and debugging
- **Context Management Infrastructure** - Production tooling for context compaction, compression evaluation, degradation detection, and memory store
- **Production Patterns** - Documentation for production-grade development workflows
- **Smoke Tests** - Automated testing framework for dashboard and core functionality
- **RLM Plugin Placeholder** - Infrastructure for future native RLM integration
- **Pyproject.toml Support** - Fallback for tachikoma directives via pyproject.toml
- **Manual RLM Kill Switch** - Ability to disable RLM integration manually
- **Path Helper Tools** - Utilities for path manipulation in scripts
- **CLI Router** - Fast intent classification routing
- **Edit Format Optimization** - Model-specific edit format selection

### Changed
- **Documentation Overhaul** - Major restructuring with new internals section
- **Intent Routing** - Enhanced routing behavior with new routes and use cases
- **Skill Loading** - Standardized skill loading, cleaned up deprecated components
- **Context Modules** - Condensed and reorganized

### Removed
- **Deprecated Components** - Removed skill-version-manager and related deprecated code

### Fixed
- **Install Script** - Multiple fixes for uv detection and script reliability
- **Windows Compatibility** - Fixed encoding issues on Windows (cp1252)
- **Script Crashes** - Fixed infinite loops and KeyError bugs in various scripts

---

## How to Use This Changelog

1. Work on `dev` branch, rebase freely
2. When ready to release:
   - Update this file with changes since last release
   - Create a git tag: `git tag -a v0.1.0 -m "Release v0.1.0"`
   - Merge to `master`
3. The changelog captures a snapshot at each release point
