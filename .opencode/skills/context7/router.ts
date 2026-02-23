#!/usr/bin/env bun
/**
 * Context7 Router - Fetch live documentation from libraries
 * Usage: bun run router.ts <operation> [args]
 */

import { $ } from "bun";

// Colors
const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  cyan: "\x1b[0;36m",
  reset: "\x1b[0m",
};

const API_BASE = "https://context7.com/api/v2";
const OUTPUT_DIR = ".tmp/external-context";

function printHeader(text: string) {
  console.log(`${colors.blue}══════════════════════════════════════════════════════════${colors.reset}`);
  console.log(`${colors.blue}${text}${colors.reset}`);
  console.log(`${colors.blue}══════════════════════════════════════════════════════════${colors.reset}`);
}

function printSuccess(msg: string) {
  console.log(`${colors.green}✓${colors.reset} ${msg}`);
}

function printWarning(msg: string) {
  console.log(`${colors.yellow}⚠${colors.reset} ${msg}`);
}

function printError(msg: string) {
  console.log(`${colors.red}✗${colors.reset} ${msg}`);
}

function encode(str: string): string {
  return encodeURIComponent(str);
}

// Search for library
async function opSearch(library: string, query: string = "general") {
  printHeader("SEARCH: Finding Library");

  if (!library) {
    printError("Library name required");
    console.log("Usage: search <library> [topic]");
    console.log("Example: search 'React' 'hooks'");
    process.exit(1);
  }

  console.log(`Library: ${library}`);
  console.log(`Query: ${query}`);
  console.log("");

  console.log("Searching Context7 API...");
  console.log("");

  try {
    const response = await fetch(
      `${API_BASE}/libs/search?libraryName=${encode(library)}&query=${encode(query)}`
    );
    const data = await response.json();

    const results = (data as any).results || [];

    if (results.length === 0) {
      printWarning(`No libraries found matching '${library}'`);
      console.log("");
      console.log("Try:");
      console.log("  - Using the exact library name");
      console.log("  - Checking spelling");
      console.log("  - Using a broader query");
      return;
    }

    console.log("Top results:");
    console.log("");

    for (const result of results.slice(0, 3)) {
      console.log(`  📚 ${result.title}`);
      console.log(`     ID: ${result.id}`);
      console.log(`     Description: ${result.description}`);
      console.log(`     Snippets: ${result.totalSnippets}`);
      console.log("");
    }

    printSuccess("Search complete");
    console.log("");
    console.log("Next: Use 'fetch' with the library ID to get documentation");
  } catch (err) {
    printError(`Search failed: ${err}`);
    process.exit(1);
  }
}

// Fetch documentation
async function opFetch(libraryId: string, query: string = "general") {
  printHeader("FETCH: Getting Documentation");

  if (!libraryId) {
    printError("Library ID required");
    console.log("Usage: fetch <library-id> [topic]");
    console.log("");
    console.log("Examples:");
    console.log("  fetch '/websites/react_dev_reference' 'useState'");
    console.log("  fetch '/fastapi/fastapi' 'dependencies'");
    process.exit(1);
  }

  // Create output directory
  await $`mkdir -p ${OUTPUT_DIR}`.quiet();

  const safeId = libraryId.replace(/[^a-zA-Z0-9_-]/g, "_");
  const outputFile = `${OUTPUT_DIR}/${safeId}_${query}.txt`;

  console.log(`Library ID: ${libraryId}`);
  console.log(`Topic: ${query}`);
  console.log(`Output: ${outputFile}`);
  console.log("");

  console.log("Fetching from Context7...");

  try {
    const response = await fetch(
      `${API_BASE}/context?libraryId=${encode(libraryId)}&query=${encode(query)}&type=txt`
    );
    const content = await response.text();

    if (!content || content.length === 0) {
      printError("No content returned (file is empty)");
      process.exit(1);
    }

    await Bun.write(outputFile, content);

    const stat = await Bun.file(outputFile).size;
    const size = stat > 1024 ? `${(stat / 1024).toFixed(1)}K` : `${stat}B`;

    console.log("");
    printSuccess("Documentation saved");
    console.log("");
    console.log(`File: ${outputFile}`);
    console.log(`Size: ${size}`);
    console.log("");
    console.log("Preview (first 20 lines):");
    console.log("---");
    console.log(content.split("\n").slice(0, 20).join("\n"));
    console.log("---");
    console.log("");
    console.log("Tip: Reference this file in your context or pass to subagents");
  } catch (err) {
    printError(`Fetch failed: ${err}`);
    process.exit(1);
  }
}

// Quick fetch (search + fetch in one)
async function opQuick(library: string, query: string = "general") {
  printHeader("QUICK: Search & Fetch");

  if (!library) {
    printError("Library name required");
    console.log("Usage: quick <library> [topic]");
    process.exit(1);
  }

  console.log(`Step 1: Searching for '${library}'...`);

  try {
    const response = await fetch(
      `${API_BASE}/libs/search?libraryName=${encode(library)}&query=${encode(query)}`
    );
    const data = await response.json();

    const results = (data as any).results || [];
    const libraryId = results[0]?.id;

    if (!libraryId) {
      printError(`Could not find library: ${library}`);
      process.exit(1);
    }

    console.log(`Found: ${libraryId}`);
    console.log("");

    await opFetch(libraryId, query);
  } catch (err) {
    printError(`Quick fetch failed: ${err}`);
    process.exit(1);
  }
}

// List cached docs
async function opList() {
  printHeader("CACHED DOCUMENTATION");

  const dir = Bun.file(OUTPUT_DIR);
  if (!(await dir.exists())) {
    printWarning("No cached documentation found");
    console.log("");
    console.log("Use 'search' or 'fetch' to get documentation");
    return;
  }

  const glob = new Bun.Glob("*.txt");
  const files = [...glob.scanSync(OUTPUT_DIR)];

  if (files.length === 0) {
    printWarning("No cached documentation found");
    return;
  }

  console.log("Cached files:");
  console.log("");

  for (const file of files) {
    const filePath = `${OUTPUT_DIR}/${file}`;
    const stat = Bun.file(filePath);
    const size = (await stat.size) > 1024
      ? `${((await stat.size) / 1024).toFixed(1)}K`
      : `${await stat.size}B`;
    console.log(`  ${file} (${size})`);
  }

  console.log("");
  printSuccess(`Found ${files.length} cached files`);
  console.log("");
  console.log("Tip: Use 'cleanup' to remove old files");
}

// Cleanup old cached docs
async function opCleanup(days: number = 7) {
  printHeader("CLEANUP: Remove Old Documentation");

  const dir = Bun.file(OUTPUT_DIR);
  if (!(await dir.exists())) {
    printWarning("No cache directory found");
    return;
  }

  console.log(`Remove files older than: ${days} days`);
  console.log("");

  const glob = new Bun.Glob("*.txt");
  const files = [...glob.scanSync(OUTPUT_DIR)];
  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;

  const oldFiles: string[] = [];
  for (const file of files) {
    const filePath = `${OUTPUT_DIR}/${file}`;
    const stat = await Bun.file(filePath);
    const mtime = (await stat.lastModified) || 0;
    if (mtime < cutoff) {
      oldFiles.push(filePath);
    }
  }

  if (oldFiles.length === 0) {
    printSuccess("No old files to remove");
    return;
  }

  console.log("Files to remove:");
  for (const file of oldFiles) {
    console.log(`  ${file}`);
  }

  console.log("");
  // In non-interactive mode, just remove
  for (const file of oldFiles) {
    await $`rm -f ${file}`.quiet();
  }
  printSuccess("Cleanup complete");
}

// Help
function opHelp() {
  console.log("Context7 - Fetch live documentation from libraries");
  console.log("");
  console.log("Usage: bun run router.ts <operation> [args]");
  console.log("");
  console.log("Operations:");
  console.log("  search <lib> [topic]    Search for library ID");
  console.log("  fetch <id> [topic]      Fetch documentation");
  console.log("  quick <lib> [topic]     Search + fetch in one");
  console.log("  list                    Show cached docs");
  console.log("  cleanup [days]          Remove old docs");
  console.log("");
  console.log("Examples:");
  console.log("  bun run router.ts search 'React' 'hooks'");
  console.log("  bun run router.ts fetch '/websites/react_dev_reference' 'useState'");
  console.log("  bun run router.ts quick 'Next.js' 'app router'");
  console.log("  bun run router.ts cleanup 7");
  console.log("");
  console.log("Note: Requires bun runtime.");
}

// Main
const args = process.argv.slice(2);
const op = args[0] || "help";

switch (op) {
  case "search":
    await opSearch(args[1], args[2] || "general");
    break;
  case "fetch":
    await opFetch(args[1], args[2] || "general");
    break;
  case "quick":
    await opQuick(args[1], args[2] || "general");
    break;
  case "list":
    await opList();
    break;
  case "cleanup":
    await opCleanup(parseInt(args[1]) || 7);
    break;
  case "help":
  case "--help":
  case "-h":
    opHelp();
    break;
  default:
    printError(`Unknown operation: ${op}`);
    console.log("Run 'bun run router.ts help' for usage");
    process.exit(1);
}
