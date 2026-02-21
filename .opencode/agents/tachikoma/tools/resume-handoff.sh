#!/usr/bin/env bash
# Thin wrapper for TypeScript handoff resume
bun run "$(dirname "$0")/../../../cli/handoff.ts" "$@"
