#!/usr/bin/env bun
/**
 * Context Manager Router
 * Manages context discovery, organization, and maintenance
 * Usage: bun run router.ts <operation> [args]
 */

import { $ } from "bun";
import { existsSync, statSync, readdirSync, writeFileSync, appendFileSync } from "fs";
import { join, basename } from "path";

// Colors
const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  reset: "\x1b[0m",
};

const CONTEXT_DIR = ".opencode/context-modules";
const TMP_DIR = ".tmp";

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

// Operation: DISCOVER - Find context files
function opDiscover(target: string = "all") {
  printHeader("DISCOVER: Finding Context Files");

  if (!existsSync(CONTEXT_DIR)) {
    printError(`Context directory not found: ${CONTEXT_DIR}`);
    process.exit(1);
  }

  console.log("Searching for context files...");
  console.log("");

  const files = readdirSync(CONTEXT_DIR)
    .filter(f => f.endsWith(".md"))
    .sort();

  if (files.length === 0) {
    printWarning("No context files found");
    return;
  }

  console.log(`Found ${files.length} context files:`);
  console.log("");

  for (const file of files) {
    const filePath = join(CONTEXT_DIR, file);
    const stat = statSync(filePath);
    const size = stat.size > 1024 ? `${(stat.size / 1024).toFixed(1)}K` : `${stat.size}B`;
    console.log(`  ${file} (${size})`);
  }

  console.log("");
  printSuccess("Discovery complete");
  console.log("");
  console.log("Tip: Use 'organize' to restructure context by concern");
}

// Operation: FETCH - Get external documentation
function opFetch(library: string, topic: string = "general") {
  printHeader("FETCH: External Documentation");

  if (!library) {
    printError("Library name required");
    console.log("Usage: fetch <library> [topic]");
    console.log("Example: fetch 'React' 'hooks'");
    process.exit(1);
  }

  console.log(`Library: ${library}`);
  console.log(`Topic: ${topic}`);
  console.log("");

  const externalDir = join(TMP_DIR, "external-context");

  console.log("To fetch live documentation:");
  console.log("");
  console.log("1. Search for library:");
  console.log(`   curl -s "https://context7.com/api/v2/libs/search?libraryName=${library}&query=${topic}" | jq '.results[0]'`);
  console.log("");
  console.log("2. Fetch documentation:");
  console.log(`   curl -s "https://context7.com/api/v2/context?libraryId=LIBRARY_ID&query=${topic}&type=txt"`);
  console.log("");
  console.log(`3. Save to: ${externalDir}/`);
  console.log("");

  printWarning("External fetching requires Context7 skill (see .opencode/skills/context7/)");
}

// Operation: HARVEST - Extract from summary files
function opHarvest(sourceFile: string) {
  printHeader(`HARVEST: Extracting Context from ${sourceFile}`);

  if (!sourceFile) {
    printError("Source file required");
    console.log("Usage: harvest <source-file>");
    console.log("Example: harvest ANALYSIS.md");
    process.exit(1);
  }

  if (!existsSync(sourceFile)) {
    printError(`File not found: ${sourceFile}`);
    process.exit(1);
  }

  console.log(`Analyzing ${sourceFile}...`);
  console.log("");

  const content = Bun.file(sourceFile);
  const text = content.text ? content.text() : "";
  const sections = text.split("\n").filter((line: string) => line.startsWith("##")).length;

  console.log(`Found ${sections} sections`);
  console.log("");

  const baseName = basename(sourceFile, ".md");
  const outputFile = join(CONTEXT_DIR, `40-${baseName.toLowerCase()}.md`);

  console.log(`Creating context file: ${outputFile}`);

  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  const output = `---
module_id: ${baseName.toLowerCase()}
name: ${baseName} - Harvested Context
priority: 40
depends_on:
  - core-contract
---

# ${baseName}

**Source:** ${sourceFile}
**Harvested:** ${timestamp}

## Key Points

${text.split("\n").filter((line: string) => line.startsWith("##")).slice(0, 10).join("\n")}

See source file for full details.
`;

  writeFileSync(outputFile, output);

  printSuccess(`Harvested to ${outputFile}`);
  console.log("");
  console.log("Next steps:");
  console.log("  1. Review and edit the harvested context");
  console.log("  2. Update navigation.md");
  console.log("  3. Run 'organize' to restructure");
}

// Operation: EXTRACT - Pull specific info
async function opExtract(file: string, query: string) {
  printHeader(`EXTRACT: Finding '${query}' in ${file}`);

  if (!file || !query) {
    printError("File and query required");
    console.log("Usage: extract <file> <query>");
    console.log("Example: extract coding-standards.md 'naming conventions'");
    process.exit(1);
  }

  let target = join(CONTEXT_DIR, file);
  if (!existsSync(target)) {
    target = join(CONTEXT_DIR, `${file}.md`);
    if (!existsSync(target)) {
      printError(`File not found: ${file}`);
      process.exit(1);
    }
  }

  console.log(`Searching in ${target}...`);
  console.log("");

  const content = await Bun.file(target).text();
  const lines = content.split("\n");
  const matches: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    if (lines[i].toLowerCase().includes(query.toLowerCase())) {
      const start = Math.max(0, i - 3);
      const end = Math.min(lines.length, i + 4);
      matches.push(lines.slice(start, end).join("\n"));
    }
  }

  if (matches.length === 0) {
    printWarning(`No matches found for '${query}'`);
    return;
  }

  console.log(matches.join("\n---\n"));
  console.log("");
  printSuccess("Extraction complete");
}

// Operation: ORGANIZE - Restructure context
function opOrganize(target: string = CONTEXT_DIR) {
  printHeader("ORGANIZE: Restructuring Context");

  console.log(`Target: ${target}`);
  console.log("");

  // Check current structure
  console.log("Current structure:");
  if (existsSync(target)) {
    const files = readdirSync(target).filter(f => f.endsWith(".md"));
    for (const file of files) {
      const stat = statSync(join(target, file));
      console.log(`  ${file} (${stat.size} bytes)`);
    }
  } else {
    console.log("  No .md files found");
  }

  console.log("");
  console.log("Organization by priority:");
  console.log("");

  const files = existsSync(target) ? readdirSync(target).filter(f => f.endsWith(".md")) : [];

  console.log("Priority 0-9 (Core):");
  files.filter(f => f.match(/^0\d/)).forEach(f => console.log(`  - ${f}`)) || console.log("  None");

  console.log("");
  console.log("Priority 10-19 (Standards):");
  files.filter(f => f.match(/^1\d/)).forEach(f => console.log(`  - ${f}`)) || console.log("  None");

  console.log("");
  console.log("Priority 20-29 (Workflows):");
  files.filter(f => f.match(/^2\d/)).forEach(f => console.log(`  - ${f}`)) || console.log("  None");

  console.log("");
  console.log("Priority 30+ (Methods & Custom):");
  files.filter(f => f.match(/^[3-9]\d/)).forEach(f => console.log(`  - ${f}`)) || console.log("  None");

  console.log("");
  printSuccess("Organization analysis complete");
  console.log("");
  console.log("Tip: Use consistent naming: ##-descriptive-name.md");
}

// Operation: CLEANUP - Remove stale files
async function opCleanup(target: string = TMP_DIR, days: number = 7) {
  printHeader("CLEANUP: Removing Stale Files");

  console.log(`Target: ${target}`);
  console.log(`Remove files older than: ${days} days`);
  console.log("");

  if (!existsSync(target)) {
    printWarning(`Directory not found: ${target}`);
    return;
  }

  const cutoff = Date.now() - days * 24 * 60 * 60 * 1000;
  const files = readdirSync(target, { recursive: true }) as string[];

  const oldFiles: string[] = [];
  for (const file of files) {
    const filePath = join(target, file);
    try {
      const stat = statSync(filePath);
      if (stat.isFile() && stat.mtimeMs < cutoff) {
        oldFiles.push(filePath);
      }
    } catch {}
  }

  if (oldFiles.length === 0) {
    printSuccess("No stale files found");
    return;
  }

  console.log("Files to remove:");
  for (const file of oldFiles.slice(0, 20)) {
    const stat = statSync(file);
    const age = Math.floor((Date.now() - stat.mtimeMs) / 86400000);
    const size = stat.size > 1024 ? `${(stat.size / 1024).toFixed(1)}K` : `${stat.size}B`;
    console.log(`  ${file} (${size}, ${age} days old)`);
  }

  console.log("");
  // Remove files
  for (const file of oldFiles) {
    try {
      await $`rm -f ${file}`.quiet();
    } catch {}
  }
  printSuccess("Cleanup complete");
}

// Operation: STATUS - Show context status
function opStatus() {
  printHeader("CONTEXT STATUS");

  // Context directory
  if (existsSync(CONTEXT_DIR)) {
    const files = readdirSync(CONTEXT_DIR).filter(f => f.endsWith(".md"));
    const totalSize = files.reduce((acc, f) => {
      const stat = statSync(join(CONTEXT_DIR, f));
      return acc + stat.size;
    }, 0);
    const sizeStr = totalSize > 1024 * 1024
      ? `${(totalSize / 1024 / 1024).toFixed(1)}M`
      : totalSize > 1024
        ? `${(totalSize / 1024).toFixed(1)}K`
        : `${totalSize}B`;
    printSuccess(`Context directory: ${files.length} files (${sizeStr})`);
  } else {
    printError("Context directory not found");
  }

  // Temporary files
  if (existsSync(TMP_DIR)) {
    const files = readdirSync(TMP_DIR, { recursive: true }) as string[];
    if (files.length > 0) {
      printWarning(`Temporary files: ${files.length} files`);
      console.log("  Run 'cleanup' to remove old files");
    } else {
      printSuccess("No temporary files");
    }
  }

  // Navigation file
  if (existsSync(join(CONTEXT_DIR, "navigation.md"))) {
    printSuccess("Navigation file exists");
  } else {
    printWarning("Navigation file missing - run this skill from project root");
  }

  console.log("");
  console.log("Operations available:");
  console.log("  discover, fetch, harvest, extract, organize, cleanup, status");
}

// Help
function opHelp() {
  console.log("Context Manager - Manage project context files");
  console.log("");
  console.log("Usage: bun run router.ts <operation> [args]");
  console.log("");
  console.log("Operations:");
  console.log("  discover [target]       Find context files");
  console.log("  fetch <lib> [topic]     Get external documentation");
  console.log("  harvest <file>          Extract from summary file");
  console.log("  extract <file> <query>  Pull specific information");
  console.log("  organize [dir]          Restructure context");
  console.log("  cleanup [dir] [days]    Remove stale files");
  console.log("  status                  Show context status");
  console.log("");
  console.log("Examples:");
  console.log("  bun run router.ts discover");
  console.log("  bun run router.ts harvest ANALYSIS.md");
  console.log("  bun run router.ts extract coding-standards 'naming conventions'");
  console.log("  bun run router.ts cleanup .tmp/ 7");
}

// Main
const args = process.argv.slice(2);
const op = args[0] || "status";

switch (op) {
  case "discover":
    opDiscover(args[1]);
    break;
  case "fetch":
    opFetch(args[1], args[2] || "general");
    break;
  case "harvest":
    opHarvest(args[1]);
    break;
  case "extract":
    opExtract(args[1], args[2]);
    break;
  case "organize":
    opOrganize(args[1] || CONTEXT_DIR);
    break;
  case "cleanup":
    opCleanup(args[1] || TMP_DIR, parseInt(args[2]) || 7);
    break;
  case "status":
    opStatus();
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
