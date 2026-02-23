#!/usr/bin/env node
/**
 * Tachikoma Framework Installer
 *
 * "Structure at the start, freedom at the end."
 *
 * Installs the Tachikoma framework to your project or globally.
 * Smart backup: only backs up changed files, respects .gitignore.
 *
 * Usage:
 *   tachikoma
 *   tachikoma --global
 *   tachikoma --local
 */

const fs = require("fs");
const path = require("path");
const os = require("os");
const readline = require("readline");
const { execSync } = require("child_process");

// =============================================================================
// COLORS
// =============================================================================

const colors = {
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  magenta: "\x1b[35m",
  blue: "\x1b[34m",
  dim: "\x1b[2m",
  bold: "\x1b[1m",
  reset: "\x1b[0m",
  white: "\x1b[37m",
  red: "\x1b[31m",
};

// =============================================================================
// MAIN BANNER - TACHIKOMA LOGO
// =============================================================================

const MAIN_BANNER =
  colors.cyan +
  "████████╗ █████╗  ██████╗██╗  ██╗██╗██╗  ██╗ ██████╗ ███╗   ███╗ █████╗\n" +
  "╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║██║ ██╔╝██╔═══██╗████╗ ████║██╔══██╗\n" +
  "   ██║   ███████║██║     ███████║██║█████╔╝ ██║   ██║██╔████╔██║███████║\n" +
  "   ██║   ██╔══██║██║     ██╔══██║██║██╔═██╗ ██║   ██║██║╚██╔╝██║██╔══██║\n" +
  "   ██║   ██║  ██║╚██████╗██║  ██║██║██║  ██╗╚██████╔╝██║ ╚═╝ ██║██║  ██║\n" +
  "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝\n" +
  colors.reset;

// =============================================================================
// CONFIG
// =============================================================================

const REPO_OWNER = "Nirvaxstiel";
const REPO_NAME = "Tachikoma-Proompt-Cookbooks";

const FILES_TO_INSTALL = [
  // CLI
  ".opencode/cli",
  // Commands
  ".opencode/commands",
  // Skills
  ".opencode/skills",
  // Agents
  ".opencode/agents",
  // Context modules
  ".opencode/context-modules",
  // Gitignore
  ".opencode/.gitignore",
];

// Default ignore patterns (always skip these during comparison)
const DEFAULT_IGNORE_PATTERNS = [
  "node_modules",
  "__pycache__",
  ".venv",
  "venv",
  "cache",
  "rlm_state",
  "spec",
  "handoffs",
  "_archive",
  "*.pyc",
  "*.pyo",
  "*.egg-info",
  ".DS_Store",
  "Thumbs.db",
  ".opencode-backup",
  "STATE.md",
  "bun.lock",
  "package-lock.json",
];

// Get OpenCode config directory per OS
function getOpenCodeConfigDir() {
  return path.join(os.homedir(), ".config", "opencode");
}

// =============================================================================
// UTILITIES
// =============================================================================

function print(msg) {
  process.stdout.write(msg);
}

function println(msg = "") {
  console.log(msg);
}

function success(msg) {
  println(`  ${colors.green}✓${colors.reset} ${msg}`);
}

function warn(msg) {
  println(`  ${colors.yellow}⚠${colors.reset} ${msg}`);
}

function error(msg) {
  println(`  ${colors.red}✗${colors.reset} ${msg}`);
}

function info(msg) {
  println(`  ${colors.cyan}ℹ${colors.reset} ${msg}`);
}

function highlight(msg) {
  println(`  ${colors.magenta}▶${colors.reset} ${msg}`);
}

function section(title) {
  println();
  println(
    `${colors.bold}${colors.cyan}  ───────────────────────────────────────────${colors.reset}`,
  );
  println(`${colors.bold}${colors.cyan}  ${title}${colors.reset}`);
  println(
    `${colors.bold}${colors.cyan}  ───────────────────────────────────────────${colors.reset}`,
  );
  println();
}

async function prompt(question) {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      rl.close();
      resolve(answer.trim());
    });
  });
}

function expandTilde(filePath) {
  if (filePath && filePath.startsWith("~/")) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

// =============================================================================
// GITIGNORE PARSING
// =============================================================================

function parseGitignore(gitignorePath) {
  const patterns = [];

  if (!fs.existsSync(gitignorePath)) {
    return patterns;
  }

  const content = fs.readFileSync(gitignorePath, "utf-8");
  const lines = content.split(/\r?\n/);

  for (const line of lines) {
    const trimmed = line.trim();
    // Skip empty lines and comments
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    patterns.push(trimmed);
  }

  return patterns;
}

// Check if a relative path matches any ignore pattern
function shouldIgnore(relPath, patterns) {
  const basename = path.basename(relPath);
  const parts = relPath.split(/[/\\]/);

  for (const pattern of patterns) {
    // Handle negation (we don't use it, but skip it)
    if (pattern.startsWith("!")) continue;

    // Handle directory patterns (ending with /)
    const dirPattern = pattern.endsWith("/") ? pattern.slice(0, -1) : pattern;

    // Handle glob patterns like *.pyc
    if (pattern.startsWith("*")) {
      const ext = pattern.slice(1);
      if (basename.endsWith(ext)) return true;
      continue;
    }

    // Exact match with basename
    if (basename === dirPattern) return true;

    // Path starts with pattern
    if (relPath.startsWith(dirPattern + "/") || relPath.startsWith(dirPattern + "\\")) {
      return true;
    }

    // Path contains pattern as directory component
    if (parts.includes(dirPattern)) return true;

    // Exact path match
    if (relPath === dirPattern) return true;
  }

  return false;
}

// =============================================================================
// FILE OPERATIONS
// =============================================================================

// Get all files in a directory recursively
function getAllFiles(dir, baseDir, ignorePatterns, files = []) {
  if (!fs.existsSync(dir)) return files;

  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relPath = path.relative(baseDir, fullPath);

    // Check ignore patterns
    if (shouldIgnore(relPath, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      getAllFiles(fullPath, baseDir, ignorePatterns, files);
    } else {
      files.push({ fullPath, relPath });
    }
  }

  return files;
}

// Compare two files for differences
function filesDiffer(file1, file2) {
  if (!fs.existsSync(file1) || !fs.existsSync(file2)) {
    return true;
  }

  try {
    const stat1 = fs.statSync(file1);
    const stat2 = fs.statSync(file2);

    // Quick size check
    if (stat1.size !== stat2.size) {
      return true;
    }

    // Content comparison
    const content1 = fs.readFileSync(file1);
    const content2 = fs.readFileSync(file2);

    return !content1.equals(content2);
  } catch {
    return true;
  }
}

// Copy directory recursively
function copyDirectory(src, dest, ignorePatterns = []) {
  fs.mkdirSync(dest, { recursive: true });

  const entries = fs.readdirSync(src, { withFileTypes: true });

  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldIgnore(entry.name, ignorePatterns)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath, ignorePatterns);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// =============================================================================
// SMART BACKUP
// =============================================================================

function createSmartBackup(targetDir, sourceDir, filesToInstall) {
  const backupDir = path.join(path.dirname(targetDir), ".opencode-backup");
  const diffReport = {
    modified: [],
    added: [],
    deleted: [],
    unchanged: [],
  };

  // Load gitignore patterns from target (existing installation)
  const gitignorePath = path.join(targetDir, ".gitignore");
  const gitignorePatterns = parseGitignore(gitignorePath);
  const allIgnorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...gitignorePatterns];

  // Get all existing files in target
  const existingFiles = getAllFiles(targetDir, targetDir, allIgnorePatterns);
  const existingMap = new Map(existingFiles.map((f) => [f.relPath, f.fullPath]));

  // Track what we're installing
  const installingFiles = new Set();

  // Process each source directory/file
  for (const relPath of filesToInstall) {
    const sourcePath = path.join(sourceDir, relPath);
    if (!fs.existsSync(sourcePath)) continue;

    if (fs.statSync(sourcePath).isDirectory()) {
      const newFiles = getAllFiles(sourcePath, sourceDir, allIgnorePatterns);
      for (const file of newFiles) {
        const fullRelPath = path.join(relPath, file.relPath);
        installingFiles.add(fullRelPath.replace(/\\/g, "/"));
      }
    } else {
      installingFiles.add(relPath.replace(/\\/g, "/"));
    }
  }

  // Compare existing files with new files
  for (const { fullPath, relPath } of existingFiles) {
    const normalizedRelPath = relPath.replace(/\\/g, "/");
    const sourceFilePath = path.join(sourceDir, normalizedRelPath);

    // Check if this file is being installed
    let isBeingInstalled = false;
    for (const installPath of installingFiles) {
      if (normalizedRelPath === installPath || normalizedRelPath.startsWith(installPath + "/")) {
        isBeingInstalled = true;
        break;
      }
    }

    if (!isBeingInstalled) {
      // File exists in target but not in source - will be deleted
      const backupPath = path.join(backupDir, relPath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.copyFileSync(fullPath, backupPath);
      diffReport.deleted.push(relPath);
      continue;
    }

    // Check if file exists in source
    if (fs.existsSync(sourceFilePath)) {
      if (filesDiffer(fullPath, sourceFilePath)) {
        // File differs - backup old version
        const backupPath = path.join(backupDir, relPath);
        fs.mkdirSync(path.dirname(backupPath), { recursive: true });
        fs.copyFileSync(fullPath, backupPath);
        diffReport.modified.push(relPath);
      } else {
        diffReport.unchanged.push(relPath);
      }
    }
  }

  // Find new files (in source but not in target)
  for (const relPath of installingFiles) {
    const targetFilePath = path.join(targetDir, relPath);
    if (!fs.existsSync(targetFilePath)) {
      diffReport.added.push(relPath);
    }
  }

  // Write diff report
  const diffReportPath = path.join(backupDir, "diff.md");
  const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19);

  let report = `# Tachikoma Update Report

Generated: ${timestamp}

## Summary

- **Modified**: ${diffReport.modified.length} files
- **Added**: ${diffReport.added.length} files
- **Deleted**: ${diffReport.deleted.length} files
- **Unchanged**: ${diffReport.unchanged.length} files

`;

  if (diffReport.modified.length > 0) {
    report += `## Modified Files\n\nPrevious versions backed up:\n\n`;
    for (const f of diffReport.modified) {
      report += `- \`${f}\`\n`;
    }
    report += "\n";
  }

  if (diffReport.added.length > 0) {
    report += `## Added Files\n\nNew in this version:\n\n`;
    for (const f of diffReport.added) {
      report += `- \`${f}\`\n`;
    }
    report += "\n";
  }

  if (diffReport.deleted.length > 0) {
    report += `## Deleted Files\n\nRemoved in this version (backed up):\n\n`;
    for (const f of diffReport.deleted) {
      report += `- \`${f}\`\n`;
    }
    report += "\n";
  }

  fs.mkdirSync(backupDir, { recursive: true });
  fs.writeFileSync(diffReportPath, report);

  return diffReport;
}

// =============================================================================
// INSTALLATION
// =============================================================================

function copyFiles(sourceDir, targetDir, filesToCopy) {
  section("INSTALL");

  let copied = 0;
  let skipped = 0;

  // Load ignore patterns
  const gitignorePath = path.join(sourceDir, ".opencode", ".gitignore");
  const gitignorePatterns = parseGitignore(gitignorePath);
  const allIgnorePatterns = [...DEFAULT_IGNORE_PATTERNS, ...gitignorePatterns];

  for (const relPath of filesToCopy) {
    const sourcePath = path.join(sourceDir, relPath);
    const targetPath = path.join(targetDir, relPath);

    if (!fs.existsSync(sourcePath)) {
      skipped++;
      continue;
    }

    // Create parent directories
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Copy
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath, allIgnorePatterns);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }

    success(relPath);
    copied++;
  }

  println();
  highlight(`Installed ${copied} items (${skipped} skipped)`);
}

// Find the Tachikoma source directory
function findTachikomaSource() {
  const scriptDir = path.dirname(__filename);
  const potentialRoot = path.join(scriptDir, "..");

  const markers = ["package.json", ".opencode"];
  const hasMarkers = markers.every((marker) =>
    fs.existsSync(path.join(potentialRoot, marker)),
  );

  if (hasMarkers) {
    return potentialRoot;
  }

  try {
    const packagePath = require.resolve("tachikoma-framework/package.json");
    return path.dirname(packagePath);
  } catch {
    // Not installed via npm
  }

  try {
    const gitRoot = execSync("git rev-parse --show-toplevel", {
      encoding: "utf-8",
      stdio: "pipe",
      cwd: scriptDir,
    }).trim();

    if (fs.existsSync(path.join(gitRoot, ".opencode"))) {
      return gitRoot;
    }
  } catch {
    // Not in a git repo
  }

  throw new Error("Could not find Tachikoma source directory");
}

async function install(isGlobal, configDir = null) {
  const openCodeDir = configDir
    ? expandTilde(configDir)
    : getOpenCodeConfigDir();

  const targetDir = isGlobal
    ? openCodeDir
    : path.join(process.cwd(), ".opencode");

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), "~")
    : targetDir.replace(process.cwd(), ".");

  println();
  info(`Installing to: ${colors.cyan}${locationLabel}${colors.reset}`);

  if (isGlobal) {
    println();
    info(
      `OpenCode will look here for config: ${colors.dim}${openCodeDir}${colors.reset}`,
    );
  }
  println();

  // Find source
  section("SOURCE");

  let sourceDir;
  try {
    sourceDir = findTachikomaSource();
    success(`Found Tachikoma at: ${sourceDir}`);
  } catch (err) {
    error(err.message);
    println();
    println(
      `  ${colors.dim}Make sure you installed tachikoma from the git repo:${colors.reset}`,
    );
    println(
      `  ${colors.dim}git clone https://github.com/${REPO_OWNER}/${REPO_NAME}.git${colors.reset}`,
    );
    println(`  ${colors.dim}cd ${REPO_NAME}${colors.reset}`);
    println(`  ${colors.dim}bash install${colors.reset}`);
    process.exit(1);
  }

  // Check if target exists - do smart backup
  if (fs.existsSync(targetDir)) {
    warn(`Existing installation found at ${targetDir}`);
    println();

    // Create smart backup
    section("BACKUP");
    info("Analyzing differences...");

    const diffReport = createSmartBackup(targetDir, sourceDir, FILES_TO_INSTALL);

    const totalChanges = diffReport.modified.length + diffReport.added.length + diffReport.deleted.length;

    if (totalChanges > 0) {
      println();
      info(`Changes detected:`);
      if (diffReport.modified.length > 0) {
        println(`  ${colors.yellow}Modified:${colors.reset} ${diffReport.modified.length} files`);
      }
      if (diffReport.added.length > 0) {
        println(`  ${colors.green}Added:${colors.reset} ${diffReport.added.length} files`);
      }
      if (diffReport.deleted.length > 0) {
        println(`  ${colors.red}Deleted:${colors.reset} ${diffReport.deleted.length} files`);
      }
      println();
      success(`Backup created: .opencode-backup/`);
      success(`Diff report: .opencode-backup/diff.md`);
    } else {
      println();
      success("No changes detected - installation is up to date");
    }

    println();
    const answer = await prompt(`  Continue with installation? [Y/n]: `);
    if (answer === "n" || answer === "N") {
      info("Installation cancelled");
      process.exit(0);
    }

    // Remove old installation (backup already created)
    info(`Removing old installation...`);
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy files
  copyFiles(sourceDir, targetDir, FILES_TO_INSTALL);

  // Final message
  println();
  println(
    `${colors.bold}${colors.green}  ╔══════════════════════════════════════════════════════════╗`,
  );
  println(
    `${colors.bold}${colors.green}  ║          TACHIKOMA INSTALLED SUCCESSFULLY!               ║`,
  );
  println(
    `${colors.bold}${colors.green}  ║                                                          ║`,
  );
  println(
    `${colors.bold}${colors.green}  ╚══════════════════════════════════════════════════════════╝`,
  );
  println();
  println(
    `  ${colors.cyan}Location:${colors.reset} ${colors.magenta}${locationLabel}${colors.reset}`,
  );
  println();
  println(`  ${colors.cyan}Next steps:${colors.reset}`);
  println();
  println(`  1. Launch opencode in your project`);
  println(
    `  2. Run ${colors.magenta}/tachikoma-help${colors.reset} to see available commands`,
  );
  println(
    `  3. Start a task with ${colors.magenta}/tachikoma-init${colors.reset}`,
  );
  println();
  println(
    `  ${colors.dim}Documentation: https://github.com/${REPO_OWNER}/${REPO_NAME}${colors.reset}`,
  );
  println();
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  const hasGlobal = args.includes("--global") || args.includes("-g");
  const hasLocal = args.includes("--local") || args.includes("-l");
  const hasHelp = args.includes("--help") || args.includes("-h");
  const noBanner = args.includes("--no-banner");

  // Parse --config-dir
  let configDir = null;
  const configDirIndex = args.findIndex(
    (arg) => arg === "--config-dir" || arg === "-c",
  );
  if (configDirIndex !== -1 && args[configDirIndex + 1]) {
    configDir = args[configDirIndex + 1];
  }

  // Choose banner
  const bannerToShow = noBanner ? null : MAIN_BANNER;

  // Show banner
  print(bannerToShow);

  // Show help
  if (hasHelp) {
    println(`${colors.yellow}Usage:${colors.reset}`);
    println(`  tachikoma [options]`);
    println();
    println(`${colors.yellow}Options:${colors.reset}`);
    println(
      `  ${colors.cyan}-g, --global${colors.reset}              Install globally (${colors.dim}OpenCode config dir${colors.reset})`,
    );
    println(
      `  ${colors.cyan}-l, --local${colors.reset}               Install locally (${colors.dim}./.opencode${colors.reset})`,
    );
    println(
      `  ${colors.cyan}-c, --config-dir <path>${colors.reset}   Custom config directory`,
    );
    println(
      `  ${colors.cyan}--no-banner${colors.reset}             Skip main banner`,
    );
    println(
      `  ${colors.cyan}-h, --help${colors.reset}                Show this help`,
    );
    println();
    println(`${colors.yellow}Examples:${colors.reset}`);
    println(
      `  ${colors.dim}# Install globally (available in all projects)${colors.reset}`,
    );
    println(`  tachikoma --global`);
    println();
    println(`  ${colors.dim}# Install to current project${colors.reset}`);
    println(`  tachikoma --local`);
    println();
    println(`${colors.yellow}Global Installation Paths:${colors.reset}`);
    println(
      `  ${colors.dim}All platforms:${colors.reset} ${colors.cyan}~/.config/opencode${colors.reset}`,
    );
    println(
      `  ${colors.dim}(On Windows: C:\\Users\\username\\.config\\opencode)${colors.reset}`,
    );
    println();
    process.exit(0);
  }

  // Validate args
  if (hasGlobal && hasLocal) {
    error("Cannot specify both --global and --local");
    process.exit(1);
  }

  if (configDir && hasLocal) {
    error("Cannot use --config-dir with --local");
    process.exit(1);
  }

  // Install
  try {
    if (configDir) {
      await install(true, configDir);
    } else if (hasGlobal) {
      await install(true, null);
    } else if (hasLocal) {
      await install(false, null);
    } else {
      // Interactive prompt
      const openCodeDir = getOpenCodeConfigDir();
      println(
        `${colors.yellow}Where would you like to install Tachikoma?${colors.reset}`,
      );
      println();
      println(
        `  ${colors.cyan}1)${colors.reset} Global ${colors.dim}(${openCodeDir.replace(os.homedir(), "~")})${colors.reset} - available in all projects`,
      );
      println(
        `  ${colors.cyan}2)${colors.reset} Local  ${colors.dim}(./.opencode)${colors.reset} - this project only`,
      );
      println();

      const answer = await prompt(`  Choice ${colors.dim}[1]${colors.reset}: `);

      const isGlobal = answer !== "2";
      await install(isGlobal, null);
    }
  } catch (err) {
    error(`Installation failed: ${err.message}`);
    println();
    println(
      `  ${colors.dim}For help, visit: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues${colors.reset}`,
    );
    process.exit(1);
  }
}

main();
