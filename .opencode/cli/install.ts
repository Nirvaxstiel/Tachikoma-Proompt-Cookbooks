#!/usr/bin/env bun
/**
 * Tachikoma Framework Installer
 *
 * Interactive CLI installer with Ghost in the Shell theming.
 *
 * Usage:
 *   bun run .opencode/cli/install.ts           # Interactive mode
 *   bun run .opencode/cli/install.ts --global  # Install globally
 *   bun run .opencode/cli/install.ts --current # Install to current dir
 *   bun run .opencode/cli/install.ts --path ./my-project --backup
 *
 * Remote installation:
 *   curl -fsSL https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/main/install.sh | bun
 */

import { parseArgs } from "node:util";
import { homedir } from "node:os";
import {
  join,
  resolve,
  dirname,
  basename,
} from "node:path";
import {
  existsSync,
  cpSync,
  rmSync,
  mkdirSync,
  renameSync,
  readdirSync,
  statSync,
  writeFileSync,
  readFileSync,
} from "node:fs";
import {
  theme,
  symbols,
  printBanner,
  printHeader,
  printStatus,
  printStep,
  printPath,
  printProgress,
  progressComplete,
  promptText,
  promptSelect,
  promptConfirm,
  exitWithMessage,
} from "./lib/prompts";

// ============================================================================
// Constants
// ============================================================================

const CLI_DIR = import.meta.dir;
const OPENCODE_DIR = join(CLI_DIR, "..");
const REPO_ROOT = join(OPENCODE_DIR, "..");
const GLOBAL_CONFIG_DIR = join(homedir(), ".config", "opencode");

const VERSION = "2.0.0";
const REPO_URL = "https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks";

// Files/folders to exclude from copy
const EXCLUDE_PATTERNS = [
  "node_modules",
  ".git",
  "*.lock",
  "bun.lock",
  "package-lock.json",
  "yarn.lock",
  "spec", // Task-specific specs
  "workflow-state.json",
  "*.backup-*",
  "reports", // Generated reports
];

// ============================================================================
// Types
// ============================================================================

type InstallTarget = "global" | "current" | "custom";

interface InstallOptions {
  target: InstallTarget;
  customPath?: string;
  backup: boolean;
  dryRun: boolean;
  yes: boolean;
}

interface PathMapping {
  opencodeDir: string;
  configJson: string;
  themesDir: string;
}

// ============================================================================
// Utility Functions
// ============================================================================

function shouldExclude(name: string): boolean {
  const lowerName = name.toLowerCase();
  return EXCLUDE_PATTERNS.some((pattern) => {
    if (pattern.startsWith("*")) {
      return lowerName.endsWith(pattern.slice(1));
    }
    return lowerName === pattern.toLowerCase();
  });
}

function getTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  const hour = String(now.getHours()).padStart(2, "0");
  const min = String(now.getMinutes()).padStart(2, "0");
  const sec = String(now.getSeconds()).padStart(2, "0");
  return `${year}${month}${day}-${hour}${min}${sec}`;
}

function getTargetPaths(target: InstallTarget, customPath?: string): PathMapping {
  let basePath: string;

  switch (target) {
    case "global":
      // Global: ~/.config/opencode/opencode/ and ~/.config/opencode/opencode.json
      // Note: "opencode" folder (no dot) contains the .opencode contents
      basePath = GLOBAL_CONFIG_DIR;
      return {
        opencodeDir: join(basePath, "opencode"),
        configJson: join(basePath, "opencode.json"),
        themesDir: join(basePath, "opencode", "themes"), // themes inside opencode folder
      };

    case "current":
      basePath = process.cwd();
      return {
        opencodeDir: join(basePath, ".opencode"),
        configJson: join(basePath, "opencode.json"),
        themesDir: join(basePath, ".opencode", "themes"),
      };

    case "custom":
      if (!customPath) {
        exitWithMessage("Custom path required for custom target", 1);
      }
      basePath = resolve(customPath);
      return {
        opencodeDir: join(basePath, ".opencode"),
        configJson: join(basePath, "opencode.json"),
        themesDir: join(basePath, ".opencode", "themes"),
      };
  }
}

function countFiles(dir: string): number {
  let count = 0;
  const items = readdirSync(dir, { withFileTypes: true });
  for (const item of items) {
    if (shouldExclude(item.name)) continue;
    if (item.isDirectory()) {
      count += countFiles(join(dir, item.name));
    } else {
      count++;
    }
  }
  return count;
}

// ============================================================================
// Core Operations
// ============================================================================

function createBackup(targetPath: string): string | null {
  if (!existsSync(targetPath)) {
    return null;
  }

  const backupPath = `${targetPath}.backup-${getTimestamp()}`;
  printStep("⟳", `Creating backup: ${basename(backupPath)}`);

  try {
    renameSync(targetPath, backupPath);
    return backupPath;
  } catch (err) {
    const error = err as Error;
    printStatus(`Failed to create backup: ${error.message}`, "error");
    return null;
  }
}

function copyDirectory(src: string, dest: string, dryRun: boolean): void {
  if (dryRun) {
    printPath("Would copy", `${src} → ${dest}`);
    return;
  }

  // Create destination if needed
  if (!existsSync(dest)) {
    mkdirSync(dest, { recursive: true });
  }

  const items = readdirSync(src, { withFileTypes: true });

  for (const item of items) {
    if (shouldExclude(item.name)) continue;

    const srcPath = join(src, item.name);
    const destPath = join(dest, item.name);

    if (item.isDirectory()) {
      copyDirectory(srcPath, destPath, dryRun);
    } else {
      if (!existsSync(destPath) || dryRun) {
        cpSync(srcPath, destPath, { force: true });
      }
    }
  }
}

function copyConfigJson(src: string, dest: string, dryRun: boolean): void {
  if (dryRun) {
    printPath("Would copy", "opencode.json → " + dest);
    return;
  }

  if (existsSync(src)) {
    cpSync(src, dest, { force: true });
  }
}

function installFramework(options: InstallOptions): void {
  const paths = getTargetPaths(options.target, options.customPath);

  printHeader("Installation Paths");
  printPath("Target", options.target === "global" ? "~/.config/opencode/" : 
             options.target === "current" ? "./" : 
             resolve(options.customPath || "."));
  printPath(options.target === "global" ? "opencode/" : ".opencode/", paths.opencodeDir);
  printPath("opencode.json", paths.configJson);
  // Note: themes are inside opencode/ or .opencode/, shown for reference
  console.log(`  ${theme.muted}${symbols.arrow}${theme.reset} ${theme.dim}themes/:${theme.reset} ${theme.dim}(inside opencode/)${theme.reset}`);
  console.log();

  // Create backup if requested
  let backupPath: string | null = null;
  if (options.backup && !options.dryRun) {
    printHeader("Backup");
    if (options.target === "global") {
      // For global, backup the entire opencode directory
      backupPath = createBackup(paths.opencodeDir);
      if (backupPath) {
        printStatus(`Backup created: ${backupPath}`, "success");
      }
    } else {
      // For current/custom, backup .opencode directory
      backupPath = createBackup(paths.opencodeDir);
      if (backupPath) {
        printStatus(`Backup created: ${backupPath}`, "success");
      }
    }
    console.log();
  }

  // Perform installation
  printHeader(options.dryRun ? "Dry Run (No changes will be made)" : "Installing");

  const sourceOpencode = OPENCODE_DIR;
  const sourceConfig = join(REPO_ROOT, "opencode.json");
  const sourceThemes = join(OPENCODE_DIR, "themes");

  // Count files for progress
  const totalFiles = countFiles(sourceOpencode) + 1; // +1 for config
  let currentFile = 0;

  // Copy .opencode directory
  printStep("→", "Copying .opencode/...");
  copyDirectory(sourceOpencode, paths.opencodeDir, options.dryRun);
  currentFile += countFiles(sourceOpencode);

  // Copy opencode.json
  printStep("→", "Copying opencode.json...");
  copyConfigJson(sourceConfig, paths.configJson, options.dryRun);
  currentFile++;

  // Themes are already in .opencode/themes
  printStep("→", "Themes included in .opencode/");

  console.log();
  printStatus(`Processed ${totalFiles} files`, "success");
  console.log();

  if (!options.dryRun) {
    printHeader("Installation Complete");
    printStatus("Tachikoma Framework installed successfully!", "success");
    console.log();

    if (backupPath) {
      printStatus(`Previous installation backed up to: ${backupPath}`, "info");
    }

    console.log();
    console.log(`  ${theme.muted}${symbols.bracketL}${theme.reset}${theme.cyan} Next Steps ${theme.reset}${theme.muted}${symbols.bracketR}${theme.reset}`);
    console.log();
    console.log(`    ${theme.text}1.${theme.reset} ${theme.dim}Add to your project's${theme.reset} ${theme.cyan}AGENTS.md${theme.reset}`);
    console.log(`    ${theme.text}2.${theme.reset} ${theme.dim}Copy${theme.reset} ${theme.cyan}opencode.json${theme.reset} ${theme.dim}to project root${theme.reset}`);
    console.log(`    ${theme.text}3.${theme.reset} ${theme.dim}Run${theme.reset} ${theme.green}opencode${theme.reset} ${theme.dim}in your project${theme.reset}`);
    console.log();
  }
}

// ============================================================================
// CLI Parsing
// ============================================================================

function printHelp(): void {
  printBanner();
  console.log(`${theme.text}Usage:${theme.reset}`);
  console.log(`  bun run install.ts [options]`);
  console.log();
  console.log(`${theme.text}Installation Modes:${theme.reset}`);
  console.log(`  ${theme.cyan}(default)${theme.reset}    Interactive mode with prompts`);
  console.log(`  ${theme.green}--global${theme.reset}      Install to ~/.config/opencode/`);
  console.log(`  ${theme.green}--current${theme.reset}     Install to current directory`);
  console.log(`  ${theme.green}--path <dir>${theme.reset}   Install to custom directory`);
  console.log();
  console.log(`${theme.text}Options:${theme.reset}`);
  console.log(`  ${theme.green}--backup${theme.reset}       Create backup before installing`);
  console.log(`  ${theme.green}--no-backup${theme.reset}    Skip backup (use with caution)`);
  console.log(`  ${theme.green}--dry-run${theme.reset}      Show what would happen, don't copy`);
  console.log(`  ${theme.green}-y, --yes${theme.reset}      Skip confirmations`);
  console.log(`  ${theme.green}-h, --help${theme.reset}     Show this help`);
  console.log();
  console.log(`${theme.text}Remote Installation:${theme.reset}`);
  console.log(`  ${theme.muted}curl -fsSL https://raw.githubusercontent.com/${theme.reset}`);
  console.log(`  ${theme.muted}  Nirvaxstiel/Tachikoma-Proompt-Cookbooks/main/install.sh | bun${theme.reset}`);
  console.log();
  console.log(`${theme.text}Examples:${theme.reset}`);
  console.log(`  ${theme.dim}# Interactive installation${theme.reset}`);
  console.log(`  bun run install.ts`);
  console.log();
  console.log(`  ${theme.dim}# Global installation with backup${theme.reset}`);
  console.log(`  bun run install.ts --global --backup`);
  console.log();
  console.log(`  ${theme.dim}# Install to specific project${theme.reset}`);
  console.log(`  bun run install.ts --path ~/projects/my-app --backup`);
  console.log();
}

async function parseCliArgs(): Promise<InstallOptions | null> {
  const { values, positionals } = parseArgs({
    args: process.argv.slice(2),
    options: {
      global: { type: "boolean", default: false },
      current: { type: "boolean", default: false },
      path: { type: "string" },
      backup: { type: "boolean", default: false },
      "no-backup": { type: "boolean", default: false },
      "dry-run": { type: "boolean", default: false },
      yes: { type: "boolean", short: "y", default: false },
      help: { type: "boolean", short: "h", default: false },
    },
    allowPositionals: true,
  });

  if (values.help) {
    printHelp();
    return null;
  }

  // Determine target
  let target: InstallTarget;
  let customPath: string | undefined;

  if (values.global) {
    target = "global";
  } else if (values.current) {
    target = "current";
  } else if (values.path) {
    target = "custom";
    customPath = values.path;
  } else {
    // No target specified - will use interactive mode
    return {
      target: "current",
      backup: false,
      dryRun: values["dry-run"],
      yes: false,
    };
  }

  return {
    target,
    customPath,
    backup: values.backup && !values["no-backup"],
    dryRun: values["dry-run"],
    yes: values.yes,
  };
}

// ============================================================================
// Interactive Mode
// ============================================================================

async function interactiveMode(): Promise<InstallOptions> {
  printBanner();

  // Ask for installation target
  const target = await promptSelect<InstallTarget>(
    "Where would you like to install Tachikoma?",
    [
      {
        value: "global",
        label: "Global (~/.config/opencode/)",
        description: "Available to all projects",
      },
      {
        value: "current",
        label: "Current directory",
        description: "Install to ./",
      },
      {
        value: "custom",
        label: "Custom path...",
        description: "Specify a directory",
      },
    ],
  );

  let customPath: string | undefined;
  if (target === "custom") {
    customPath = await promptText("Enter installation path", process.cwd());
  }

  // Check if target exists and ask about backup
  const paths = getTargetPaths(target, customPath);
  let backup = false;

  if (existsSync(paths.opencodeDir)) {
    console.log();
    printStatus(`Existing installation found at ${paths.opencodeDir}`, "warning");
    backup = await promptConfirm("Create backup before installing?", true);
  }

  // Final confirmation
  console.log();
  const confirmed = await promptConfirm("Proceed with installation?", true);

  if (!confirmed) {
    exitWithMessage("Installation cancelled", 0);
  }

  return {
    target,
    customPath,
    backup,
    dryRun: false,
    yes: false,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main(): Promise<number> {
  // Check if we're being run remotely (no local files)
  const isRemote = !existsSync(join(CLI_DIR, "router.ts"));

  if (isRemote) {
    // Clone repo and run installer
    printBanner();
    printStatus("Remote installation detected", "info");
    printStatus("Please run: bun run install.ts", "info");
    console.log();
    console.log(`  ${theme.muted}Or use:${theme.reset}`);
    console.log(`  ${theme.cyan}bunx github:Nirvaxstiel/Tachikoma-Proompt-Cookbooks${theme.reset}`);
    return 0;
  }

  // Parse CLI args
  const cliOptions = await parseCliArgs();

  if (!cliOptions) {
    // Help was shown
    return 0;
  }

  // Determine if interactive or CLI mode
  // CLI mode: --global, --current, --path, or --yes flag
  const args = process.argv.slice(2);
  const hasTargetFlag = args.includes("--global") || args.includes("--current") || args.includes("--path");
  const hasYesFlag = args.includes("-y") || args.includes("--yes");

  let options: InstallOptions;
  if (hasTargetFlag || hasYesFlag) {
    // CLI mode (explicit flags provided)
    printBanner();
    options = cliOptions;
  } else {
    // Interactive mode
    options = await interactiveMode();
    // Preserve dryRun from CLI if provided
    if (cliOptions.dryRun) {
      options.dryRun = true;
    }
  }

  // Run installation
  installFramework(options);

  return 0;
}

// Run
main().then((code) => process.exit(code));
