#!/usr/bin/env bash
# Thin wrapper for TypeScript help
bun run "$(dirname "$0")/../../../cli/help.ts" "$@"
