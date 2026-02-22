#!/usr/bin/env bun
/**
 * Persistent mini-REPL for RLM-style workflows
 * 
 * This script provides a *stateful* environment across invocations by
 * saving state to disk as JSON.
 * 
 * Typical flow:
 *   1) Initialise context:
 *        bun run rlm-repl.ts init path/to/context.txt
 *   2) Execute code repeatedly (state persists):
 *        bun run rlm-repl.ts exec -c 'console.log(content.length)'
 * 
 * Converted from: rlm_repl.py
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'fs';
import { join, dirname } from 'path';
import { colors, printHeader } from '../../cli/lib/colors';
import { $ } from 'bun';

const DEFAULT_STATE_PATH = '.opencode/rlm_state/state.json';
const DEFAULT_MAX_OUTPUT_CHARS = 8000;

interface RlmContext {
  path: string;
  loaded_at: number;
  content: string;
}

interface RlmState {
  version: number;
  context: RlmContext;
  buffers: string[];
  globals: Record<string, unknown>;
}

interface SubLlmResult {
  success: boolean;
  result?: unknown;
  error?: string;
  raw_output?: string;
  chunk_id?: string;
  hint?: string;
}

interface GrepMatch {
  match: string;
  span: [number, number];
  snippet: string;
}

interface Helpers {
  peek: (start?: number, end?: number) => string;
  grep: (pattern: string | RegExp, maxMatches?: number, window?: number) => GrepMatch[];
  chunkIndices: (size?: number, overlap?: number) => [number, number][];
  writeChunks: (outDir: string, size?: number, overlap?: number, prefix?: string) => string[];
  addBuffer: (text: string) => void;
  subLlm: (prompt: string, chunk?: string, chunkFile?: string) => Promise<SubLlmResult>;
}

function ensureParentDir(path: string): void {
  mkdirSync(dirname(path), { recursive: true });
}

function loadState(statePath: string): RlmState {
  if (!existsSync(statePath)) {
    throw new Error(`No state found at ${statePath}. Run: bun run rlm-repl.ts init <context_path>`);
  }
  
  const data = readFileSync(statePath, 'utf-8');
  const state = JSON.parse(data);
  
  if (typeof state !== 'object' || state === null) {
    throw new Error(`Corrupt state file: ${statePath}`);
  }
  
  return state as RlmState;
}

function saveState(state: RlmState, statePath: string): void {
  ensureParentDir(statePath);
  
  const tmpPath = statePath + '.tmp';
  writeFileSync(tmpPath, JSON.stringify(state, null, 2));
  
  // Atomic rename
  const fs = require('fs');
  fs.renameSync(tmpPath, statePath);
}

function readTextFile(path: string, maxBytes?: number): string {
  if (!existsSync(path)) {
    throw new Error(`Context file does not exist: ${path}`);
  }
  
  const buffer = readFileSync(path);
  const data = maxBytes ? buffer.slice(0, maxBytes) : buffer;
  
  return data.toString('utf-8');
}

function truncate(s: string, maxChars: number): string {
  if (maxChars <= 0) return '';
  if (s.length <= maxChars) return s;
  return s.slice(0, maxChars) + `\n... [truncated to ${maxChars} chars] ...\n`;
}

function isJsonSerializable(value: unknown): boolean {
  try {
    JSON.stringify(value);
    return true;
  } catch {
    return false;
  }
}

function filterSerializable(d: Record<string, unknown>): { kept: Record<string, unknown>; dropped: string[] } {
  const kept: Record<string, unknown> = {};
  const dropped: string[] = [];
  
  for (const [k, v] of Object.entries(d)) {
    if (isJsonSerializable(v)) {
      kept[k] = v;
    } else {
      dropped.push(k);
    }
  }
  
  return { kept, dropped };
}

function makeHelpers(contextRef: RlmContext, buffersRef: string[]): Helpers {
  const peek = (start = 0, end = 1000): string => {
    return contextRef.content.slice(start, end);
  };

  const grep = (
    pattern: string | RegExp,
    maxMatches = 20,
    window = 120
  ): GrepMatch[] => {
    const content = contextRef.content;
    const regex = typeof pattern === 'string' ? new RegExp(pattern, 'g') : pattern;
    const results: GrepMatch[] = [];
    
    let match;
    const globalRegex = new RegExp(regex.source, regex.flags.includes('g') ? regex.flags : regex.flags + 'g');
    
    while ((match = globalRegex.exec(content)) !== null) {
      const start = match.index;
      const end = match.index + match[0].length;
      const snippetStart = Math.max(0, start - window);
      const snippetEnd = Math.min(content.length, end + window);
      
      results.push({
        match: match[0],
        span: [start, end],
        snippet: content.slice(snippetStart, snippetEnd),
      });
      
      if (results.length >= maxMatches) break;
    }
    
    return results;
  };

  const chunkIndices = (size = 200000, overlap = 0): [number, number][] => {
    if (size <= 0) throw new Error('size must be > 0');
    if (overlap < 0) throw new Error('overlap must be >= 0');
    if (overlap >= size) throw new Error('overlap must be < size');
    
    const content = contextRef.content;
    const n = content.length;
    const spans: [number, number][] = [];
    const step = size - overlap;
    
    for (let start = 0; start < n; start += step) {
      const end = Math.min(n, start + size);
      spans.push([start, end]);
      if (end >= n) break;
    }
    
    return spans;
  };

  const writeChunks = (
    outDir: string,
    size = 200000,
    overlap = 0,
    prefix = 'chunk'
  ): string[] => {
    const content = contextRef.content;
    const spans = chunkIndices(size, overlap);
    mkdirSync(outDir, { recursive: true });
    
    const paths: string[] = [];
    for (let i = 0; i < spans.length; i++) {
      const [s, e] = spans[i];
      const p = join(outDir, `${prefix}_${String(i).padStart(4, '0')}.txt`);
      writeFileSync(p, content.slice(s, e), 'utf-8');
      paths.push(p);
    }
    
    return paths;
  };

  const addBuffer = (text: string): void => {
    buffersRef.push(String(text));
  };

  const subLlm = async (
    prompt: string,
    chunk?: string,
    chunkFile?: string
  ): Promise<SubLlmResult> => {
    if (process.env.OPENCODE_RLM_DISABLED === '1') {
      return {
        success: false,
        error: 'RLM integration disabled (OPENCODE_RLM_DISABLED=1)',
        chunk_id: undefined,
      };
    }

    const cliPath = process.env.OPENCODE_RLM_CLI_PATH || 'opencode';
    const agent = process.env.OPENCODE_RLM_AGENT || 'rlm-subcall';
    const timeout = parseInt(process.env.OPENCODE_RLM_TIMEOUT || '120', 10) * 1000;

    let fullPrompt = prompt;
    let chunkId = 'inline';

    if (chunkFile) {
      fullPrompt = `${prompt}\n\nChunk file: ${chunkFile}`;
      chunkId = chunkFile;
    } else if (chunk) {
      const chunkDir = '.opencode/rlm_state/chunks';
      mkdirSync(chunkDir, { recursive: true });
      chunkId = `chunk_${Date.now()}`;
      const chunkPath = join(chunkDir, `${chunkId}.txt`);
      writeFileSync(chunkPath, chunk, 'utf-8');
      fullPrompt = `${prompt}\n\nChunk file: ${chunkPath}`;
    }

    try {
      const result = Bun.spawnSync([
        cliPath,
        'task',
        '--agent', agent,
        '--description', 'RLM chunk analysis',
        '--prompt', fullPrompt,
      ], {
        timeout,
        maxBuffer: 1024 * 1024 * 10,
      });

      if (result.exitCode !== 0) {
        return {
          success: false,
          error: `CLI error: ${result.stderr.toString()}`,
          chunk_id: chunkId,
        };
      }

      const output = result.stdout.toString().trim();

      try {
        const jsonStart = output.indexOf('{');
        const jsonEnd = output.lastIndexOf('}') + 1;
        if (jsonStart !== -1 && jsonEnd > jsonStart) {
          const jsonStr = output.slice(jsonStart, jsonEnd);
          const parsed = JSON.parse(jsonStr);
          return {
            success: true,
            result: parsed,
            raw_output: output,
            chunk_id: chunkId,
          };
        }
      } catch {
        // Not JSON, return raw output
      }

      return {
        success: true,
        result: { text: output },
        raw_output: output,
        chunk_id: chunkId,
      };
    } catch (e: unknown) {
      const err = e as Error & { errno?: number };
      if (err.errno === 'ETIMEDOUT' || err.message?.includes('timeout')) {
        return {
          success: false,
          error: `Timeout after ${timeout / 1000}s`,
          chunk_id: chunkId,
        };
      }
      return {
        success: false,
        error: err.message || String(e),
        chunk_id: chunkId,
      };
    }
  };

  return { peek, grep, chunkIndices, writeChunks, addBuffer, subLlm };
}

// Commands
function cmdInit(args: { state: string; context: string; maxBytes?: number }): number {
  const statePath = args.state;
  const ctxPath = args.context;

  const content = readTextFile(ctxPath, args.maxBytes);
  const state: RlmState = {
    version: 1,
    context: {
      path: ctxPath,
      loaded_at: Date.now(),
      content,
    },
    buffers: [],
    globals: {},
  };

  saveState(state, statePath);

  console.log(`Initialised RLM REPL state at: ${statePath}`);
  console.log(`Loaded context: ${ctxPath} (${content.length.toLocaleString()} chars)`);
  return 0;
}

function cmdStatus(args: { state: string; showVars?: boolean }): number {
  const state = loadState(args.state);
  const ctx = state.context;
  const buffers = state.buffers;
  const g = state.globals;

  console.log('RLM REPL status');
  console.log(`  State file: ${args.state}`);
  console.log(`  Context path: ${ctx.path}`);
  console.log(`  Context chars: ${ctx.content.length.toLocaleString()}`);
  console.log(`  Buffers: ${buffers.length}`);
  console.log(`  Persisted vars: ${Object.keys(g).length}`);
  
  if (args.showVars && Object.keys(g).length > 0) {
    for (const k of Object.keys(g).sort()) {
      console.log(`    - ${k}`);
    }
  }
  
  return 0;
}

function cmdReset(args: { state: string }): number {
  if (existsSync(args.state)) {
    unlinkSync(args.state);
    console.log(`Deleted state: ${args.state}`);
  } else {
    console.log(`No state to delete at: ${args.state}`);
  }
  return 0;
}

function cmdExportBuffers(args: { state: string; out: string }): number {
  const state = loadState(args.state);
  const buffers = state.buffers;
  
  ensureParentDir(args.out);
  writeFileSync(args.out, buffers.join('\n\n'), 'utf-8');
  console.log(`Wrote ${buffers.length} buffers to: ${args.out}`);
  
  return 0;
}

function cmdExec(args: { state: string; code?: string; maxOutputChars?: number; warnUnserializable?: boolean }): number {
  const statePath = args.state;
  const state = loadState(statePath);

  const ctx = state.context;
  if (!ctx || !ctx.content) {
    throw new Error("State is missing a valid 'context'. Re-run init.");
  }

  const buffers = state.buffers || [];
  const persisted = state.globals || {};

  let code = args.code;
  if (!code) {
    // Read from stdin
    code = readFileSync(0, 'utf-8');
  }

  // Build execution environment
  const helpers = makeHelpers(ctx, buffers);

  // Execute in a sandboxed context
  let stdout = '';
  let stderr = '';

  try {
    // Create a function with helpers in scope
    const fn = new Function(
      'context', 'content', 'buffers',
      'peek', 'grep', 'chunkIndices', 'writeChunks', 'addBuffer', 'subLlm',
      '__persisted__',
      `
      const { ${Object.keys(persisted).join(', ')} } = __persisted__;
      ${code}
      `
    );

    // Capture console.log
    const originalLog = console.log;
    const originalError = console.error;
    
    console.log = (...args: unknown[]) => {
      stdout += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\n';
    };
    console.error = (...args: unknown[]) => {
      stderr += args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' ') + '\n';
    };

    try {
      fn(
        ctx, ctx.content, buffers,
        helpers.peek, helpers.grep, helpers.chunkIndices, helpers.writeChunks, helpers.addBuffer, helpers.subLlm,
        persisted
      );
    } finally {
      console.log = originalLog;
      console.error = originalError;
    }
  } catch (e) {
    stderr += `Error: ${(e as Error).message}\n`;
    if ((e as Error).stack) {
      stderr += (e as Error).stack + '\n';
    }
  }

  // Save state
  state.buffers = buffers;
  
  // Note: We can't easily extract new variables from the Function scope
  // For full variable persistence, a more sophisticated approach would be needed
  
  saveState(state, statePath);

  if (stdout) {
    process.stdout.write(truncate(stdout, args.maxOutputChars || DEFAULT_MAX_OUTPUT_CHARS));
  }

  if (stderr) {
    process.stderr.write(truncate(stderr, args.maxOutputChars || DEFAULT_MAX_OUTPUT_CHARS));
  }

  return 0;
}

// CLI
function printUsage(): void {
  printHeader('RLM REPL');
  console.log(`
${colors.yellow}Usage:${colors.reset}
  bun run rlm-repl.ts <command> [args]

${colors.yellow}Commands:${colors.reset}
  ${colors.green}init${colors.reset} <context>           Initialise state from context file
  ${colors.green}status${colors.reset} [--show-vars]      Show current state
  ${colors.green}reset${colors.reset}                     Delete state file
  ${colors.green}export-buffers${colors.reset} <out>      Export buffers to file
  ${colors.green}exec${colors.reset} [-c <code>]          Execute code

${colors.yellow}Examples:${colors.reset}
  bun run rlm-repl.ts init context.txt
  bun run rlm-repl.ts status
  bun run rlm-repl.ts exec -c "console.log(content.length)"
`);
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);

  if (args.length === 0 || args[0] === '--help' || args[0] === '-h') {
    printUsage();
    process.exit(0);
  }

  let statePath = DEFAULT_STATE_PATH;

  // Parse global --state flag
  let i = 0;
  while (i < args.length) {
    if (args[i] === '--state' && args[i + 1]) {
      statePath = args[i + 1];
      args.splice(i, 2);
      break;
    }
    i++;
  }

  const command = args[0];

  try {
    let exitCode = 0;

    switch (command) {
      case 'init':
        if (args.length < 2) {
          console.error(`${colors.red}Error: init requires <context>${colors.reset}`);
          process.exit(1);
        }
        exitCode = cmdInit({
          state: statePath,
          context: args[1],
          maxBytes: undefined,
        });
        break;

      case 'status':
        exitCode = cmdStatus({
          state: statePath,
          showVars: args.includes('--show-vars'),
        });
        break;

      case 'reset':
        exitCode = cmdReset({ state: statePath });
        break;

      case 'export-buffers':
        if (args.length < 2) {
          console.error(`${colors.red}Error: export-buffers requires <out>${colors.reset}`);
          process.exit(1);
        }
        exitCode = cmdExportBuffers({
          state: statePath,
          out: args[1],
        });
        break;

      case 'exec': {
        let code: string | undefined;
        let maxOutputChars = DEFAULT_MAX_OUTPUT_CHARS;
        let warnUnserializable = false;

        for (let j = 1; j < args.length; j++) {
          if ((args[j] === '-c' || args[j] === '--code') && args[j + 1]) {
            code = args[++j];
          } else if (args[j] === '--max-output-chars' && args[j + 1]) {
            maxOutputChars = parseInt(args[++j], 10);
          } else if (args[j] === '--warn-unserializable') {
            warnUnserializable = true;
          }
        }

        exitCode = cmdExec({
          state: statePath,
          code,
          maxOutputChars,
          warnUnserializable,
        });
        break;
      }

      default:
        console.error(`${colors.red}Unknown command: ${command}${colors.reset}`);
        printUsage();
        process.exit(1);
    }

    process.exit(exitCode);
  } catch (e) {
    console.error(`${colors.red}ERROR:${colors.reset} ${(e as Error).message}`);
    process.exit(2);
  }
}

export {
  loadState,
  saveState,
  makeHelpers,
  getAdaptiveChunker,
  getParallelProcessor,
};

// Re-export from other modules
import { getAdaptiveChunker } from './adaptive-chunker';
import { getParallelProcessor } from './parallel-processor';

main();
