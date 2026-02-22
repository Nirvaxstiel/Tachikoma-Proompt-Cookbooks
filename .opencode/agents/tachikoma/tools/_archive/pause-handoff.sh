#!/usr/bin/env bash
# Thin wrapper for TypeScript handoff pause
bun run "$(dirname "$0")/../../../cli/handoff.ts" "$@"
