#!/usr/bin/env bash
# Thin wrapper for TypeScript state-update
bun run "$(dirname "$0")/../../../cli/state-update.ts" "$@"
