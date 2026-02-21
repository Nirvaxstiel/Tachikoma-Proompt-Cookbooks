#!/usr/bin/env bash
# Thin wrapper for TypeScript progress
bun run "$(dirname "$0")/../../../cli/progress.ts" "$@"
