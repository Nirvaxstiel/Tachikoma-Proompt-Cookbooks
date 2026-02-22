#!/usr/bin/env bash
# Thin wrapper for TypeScript spec-setup
bun run "$(dirname "$0")/../../../../cli/spec-setup.ts" "$@"
