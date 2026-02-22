#!/usr/bin/env bash
# Thin wrapper for TypeScript unify
bun run "$(dirname "$0")/../../../cli/unify.ts" "$@"
