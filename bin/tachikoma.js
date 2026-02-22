#!/usr/bin/env node
/**
 * Tachikoma Framework Installer
 * 
 * "Structure at the start, freedom at the end."
 * 
 * Assumes tachikoma was installed via the local install script.
 * Copies files from the Tachikoma repo to your project.
 * 
 * Usage:
 *   tachikoma
 *   tachikoma --global
 *   tachikoma --local
 */

const fs = require('fs');
const path = require('path');
const os = require('os');
const readline = require('readline');
const { execSync } = require('child_process');

// =============================================================================
// COLORS
// =============================================================================

const colors = {
  cyan: '\x1b[36m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  magenta: '\x1b[35m',
  blue: '\x1b[34m',
  dim: '\x1b[2m',
  bold: '\x1b[1m',
  reset: '\x1b[0m',
  white: '\x1b[37m',
  red: '\x1b[31m',
};

// =============================================================================
// ASCII ART - TACHIKOMA (Ghost in the Shell themed)
// =============================================================================

const BANNER = `
${colors.cyan}                    ╭──────────────────────╮
${colors.cyan}                    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
${colors.cyan}                    │ ▓  ${colors.magenta}TACHIKOMA${colors.cyan}      ▓ │
${colors.cyan}                    │ ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓ │
${colors.cyan}                    │                      │
${colors.cyan}            ╭───────┴──────────────────────┴───────╮
${colors.cyan}            │  ${colors.dim}◆ ◆${colors.cyan}                        ${colors.dim}◆ ◆${colors.cyan}  │
${colors.cyan}            │     ${colors.magenta}╲ ${colors.cyan}                    ${colors.magenta}╱${colors.cyan}     │
${colors.cyan}            │       ${colors.magenta}╲ ${colors.cyan}                ${colors.magenta}╱${colors.cyan}       │
${colors.cyan}    ╭───────┴─────────────────────────────────────────┴───────╮
${colors.cyan}    │                                                       │
${colors.cyan}    │   ${colors.dim}╭──╮${colors.cyan}                                     ${colors.dim}╭──╮${colors.cyan}   │
${colors.cyan}    │   ${colors.dim}│▓▓│${colors.cyan}    ╔═════════════════════════╗    ${colors.dim}│▓▓│${colors.cyan}   │
${colors.cyan}    │   ${colors.dim}╰──╯${colors.cyan}    ║  ${colors.magenta}THINK TANK${colors.cyan}           ║    ${colors.dim}│▓▓│${colors.cyan}   │
${colors.cyan}    │           ║  ${colors.dim}TYPE-II${colors.cyan}              ║           │
${colors.cyan}    │           ╚═════════════════════════╝           │
${colors.cyan}    │                                                       │
${colors.cyan}    ╰───────────────────────────────────────────────────────╯
${colors.cyan}            │  ${colors.magenta}││${colors.cyan}    ${colors.magenta}││${colors.cyan}    ${colors.magenta}││${colors.cyan}    ${colors.magenta}││${colors.cyan}    │
${colors.cyan}            ╰──${colors.magenta}││${colors.cyan}────${colors.magenta}││${colors.cyan}────${colors.magenta}││${colors.cyan}────${colors.magenta}││${colors.cyan}──╯
${colors.reset}

${colors.bold}${colors.magenta}  TACHIKOMA FRAMEWORK${colors.reset} ${colors.dim}v2.0.0${colors.reset}
${colors.cyan}  "Structure at the start, freedom at the end."${colors.reset}
${colors.dim}
  ═══════════════════════════════════════════════════════${colors.reset}
`;

// =============================================================================
// CONFIG
// =============================================================================

const REPO_OWNER = 'Nirvaxstiel';
const REPO_NAME = 'Tachikoma-Proompt-Cookbooks';

const FILES_TO_INSTALL = [
  // CLI
  '.opencode/cli',
  // Commands
  '.opencode/commands',
  // Skills
  '.opencode/skills',
  // Agents
  '.opencode/agents',
  // Context modules
  '.opencode/context-modules',
  // Tachikoma internals
  '.opencode/agents/tachikoma/templates',
  '.opencode/agents/tachikoma/patterns',
  '.opencode/agents/tachikoma/plugins',
  // Gitignore
  '.opencode/.gitignore',
];

const IGNORE_PATTERNS = [
  '_archive',
  '__pycache__',
  'node_modules',
  '.venv',
  'cache',
  '*.pyc',
  '*.pyo',
  '*.exe',
  '*.dll',
  'bun.lock',
  'package-lock.json',
];

// Get OpenCode config directory per OS
// Based on https://opencode.ai/docs/config/ and user testing
// Global config directory contains: opencode.json + agents/, commands/, plugins/, skills/, tools/, themes/
// Uses ~/.config/opencode on all platforms for consistency
function getOpenCodeConfigDir() {
  // All platforms use ~/.config/opencode
  // Windows: C:\Users\username\.config\opencode
  // macOS:   /Users/username/.config/opencode
  // Linux:   /home/username/.config/opencode
  return path.join(os.homedir(), '.config', 'opencode');
}

// =============================================================================
// UTILITIES
// =============================================================================

function print(msg) {
  process.stdout.write(msg);
}

function println(msg = '') {
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
  println(`${colors.bold}${colors.cyan}  ══ ${title} ══${colors.reset}`);
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
  if (filePath && filePath.startsWith('~/')) {
    return path.join(os.homedir(), filePath.slice(2));
  }
  return filePath;
}

function shouldIgnore(itemPath) {
  const basename = path.basename(itemPath);
  return IGNORE_PATTERNS.some(pattern => {
    if (pattern.startsWith('*')) {
      return basename.endsWith(pattern.slice(1));
    }
    return basename === pattern || itemPath.includes(`/${pattern}/`) || itemPath.includes(`\\${pattern}\\`);
  });
}

// Find the Tachikoma source directory
function findTachikomaSource() {
  // Try to find the source directory relative to this script
  // The script should be in <tachikoma-repo>/bin/tachikoma.js
  
  const scriptDir = path.dirname(__filename);
  const potentialRoot = path.join(scriptDir, '..');
  
  // Check if this looks like the Tachikoma repo
  const markers = ['package.json', '.opencode'];
  const hasMarkers = markers.every(marker => fs.existsSync(path.join(potentialRoot, marker)));
  
  if (hasMarkers) {
    return potentialRoot;
  }
  
  // If we're installed via npm/pkg, __dirname might be in a different location
  // Try to find the package location
  try {
    const packagePath = require.resolve('tachikoma-framework/package.json');
    return path.dirname(packagePath);
  } catch {
    // Not installed via npm, try alternative methods
  }
  
  // Last resort: try to find via git if we're in the repo
  try {
    const gitRoot = execSync('git rev-parse --show-toplevel', { 
      encoding: 'utf-8', 
      stdio: 'pipe',
      cwd: scriptDir 
    }).trim();
    
    if (fs.existsSync(path.join(gitRoot, '.opencode'))) {
      return gitRoot;
    }
  } catch {
    // Not in a git repo or git not available
  }
  
  throw new Error('Could not find Tachikoma source directory');
}

// =============================================================================
// INSTALLATION
// =============================================================================

function copyDirectory(src, dest) {
  fs.mkdirSync(dest, { recursive: true });
  
  const entries = fs.readdirSync(src, { withFileTypes: true });
  
  for (const entry of entries) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (shouldIgnore(srcPath)) {
      continue;
    }

    if (entry.isDirectory()) {
      copyDirectory(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

function copyFiles(sourceDir, targetDir, filesToCopy) {
  section('INSTALL');

  let copied = 0;
  let skipped = 0;

  for (const relPath of filesToCopy) {
    const sourcePath = path.join(sourceDir, relPath);
    const targetPath = path.join(targetDir, relPath);

    if (!fs.existsSync(sourcePath)) {
      skipped++;
      continue;
    }

    // Check if should ignore
    if (shouldIgnore(sourcePath)) {
      skipped++;
      continue;
    }

    // Create parent directories
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });

    // Copy
    if (fs.statSync(sourcePath).isDirectory()) {
      copyDirectory(sourcePath, targetPath);
    } else {
      fs.copyFileSync(sourcePath, targetPath);
    }

    success(relPath);
    copied++;
  }

  println();
  highlight(`Installed ${copied} items (${skipped} skipped)`);
}

async function install(isGlobal, configDir = null) {
  const openCodeDir = configDir 
    ? expandTilde(configDir)
    : getOpenCodeConfigDir();
  
  const targetDir = isGlobal
    ? openCodeDir
    : path.join(process.cwd(), '.opencode');

  const locationLabel = isGlobal
    ? targetDir.replace(os.homedir(), '~')
    : targetDir.replace(process.cwd(), '.');

  println();
  info(`Installing to: ${colors.cyan}${locationLabel}${colors.reset}`);
  
  // Show OpenCode path info
  if (isGlobal) {
    println();
    info(`OpenCode will look here for config: ${colors.dim}${openCodeDir}${colors.reset}`);
  }
  println();

  // Find source
  section('SOURCE');
  
  let sourceDir;
  try {
    sourceDir = findTachikomaSource();
    success(`Found Tachikoma at: ${sourceDir}`);
  } catch (err) {
    error(err.message);
    println();
    println(`  ${colors.dim}Make sure you installed tachikoma from the git repo:${colors.reset}`);
    println(`  ${colors.dim}git clone https://github.com/${REPO_OWNER}/${REPO_NAME}.git${colors.reset}`);
    println(`  ${colors.dim}cd ${REPO_NAME}${colors.reset}`);
    println(`  ${colors.dim}bash install${colors.reset}`);
    process.exit(1);
  }

  // Check if target exists
  if (fs.existsSync(targetDir)) {
    warn(`Existing installation found at ${targetDir}`);
    const answer = await prompt(`  Overwrite? [y/N]: `);
    if (answer !== 'y' && answer !== 'Y') {
      info('Installation cancelled');
      process.exit(0);
    }
    
    info(`Removing existing installation...`);
    fs.rmSync(targetDir, { recursive: true, force: true });
  }

  // Copy files
  copyFiles(sourceDir, targetDir, FILES_TO_INSTALL);

  // Final message
  println();
  println(`${colors.bold}${colors.green}  ╔══════════════════════════════════════════════════════╗${colors.reset}`);
  println(`${colors.bold}${colors.green}  ║                                                      ║${colors.reset}`);
  println(`${colors.bold}${colors.green}  ║  ${colors.reset}${colors.bold}TACHIKOMA INSTALLED SUCCESSFULLY!${colors.bold}${colors.green}             ║${colors.reset}`);
  println(`${colors.bold}${colors.green}  ║                                                      ║${colors.reset}`);
  println(`${colors.bold}${colors.green}  ╚══════════════════════════════════════════════════════╝${colors.reset}`);
  println();
  println(`  ${colors.cyan}Location:${colors.reset} ${colors.magenta}${locationLabel}${colors.reset}`);
  println();
  println(`  ${colors.cyan}Next steps:${colors.reset}`);
  println();
  println(`  1. Launch opencode in your project`);
  println(`  2. Run ${colors.magenta}/tachikoma-help${colors.reset} to see available commands`);
  println(`  3. Start a task with ${colors.magenta}/tachikoma-init${colors.reset}`);
  println();
  println(`  ${colors.dim}Documentation: https://github.com/${REPO_OWNER}/${REPO_NAME}${colors.reset}`);
  println();
}

// =============================================================================
// CLI
// =============================================================================

async function main() {
  const args = process.argv.slice(2);

  // Parse args
  const hasGlobal = args.includes('--global') || args.includes('-g');
  const hasLocal = args.includes('--local') || args.includes('-l');
  const hasHelp = args.includes('--help') || args.includes('-h');

  // Parse --config-dir
  let configDir = null;
  const configDirIndex = args.findIndex(arg => arg === '--config-dir' || arg === '-c');
  if (configDirIndex !== -1 && args[configDirIndex + 1]) {
    configDir = args[configDirIndex + 1];
  }

  // Show banner
  print(BANNER);

  // Show help
  if (hasHelp) {
    println(`${colors.yellow}Usage:${colors.reset}`);
    println(`  tachikoma [options]`);
    println();
    println(`${colors.yellow}Options:${colors.reset}`);
    println(`  ${colors.cyan}-g, --global${colors.reset}              Install globally (${colors.dim}OpenCode config dir${colors.reset})`);
    println(`  ${colors.cyan}-l, --local${colors.reset}               Install locally (${colors.dim}./.opencode${colors.reset})`);
    println(`  ${colors.cyan}-c, --config-dir <path>${colors.reset}   Custom config directory`);
    println(`  ${colors.cyan}-h, --help${colors.reset}                Show this help`);
    println();
    println(`${colors.yellow}Examples:${colors.reset}`);
    println(`  ${colors.dim}# Install globally (available in all projects)${colors.reset}`);
    println(`  tachikoma --global`);
    println();
    println(`  ${colors.dim}# Install to current project${colors.reset}`);
    println(`  tachikoma --local`);
    println();
    println(`${colors.yellow}Global Installation Paths:${colors.reset}`);
    println(`  ${colors.dim}All platforms:${colors.reset} ${colors.cyan}~/.config/opencode${colors.reset}`);
    println(`  ${colors.dim}(On Windows: C:\\Users\\username\\.config\\opencode)${colors.reset}`);
    println();
    process.exit(0);
  }

  // Validate args
  if (hasGlobal && hasLocal) {
    error('Cannot specify both --global and --local');
    process.exit(1);
  }

  if (configDir && hasLocal) {
    error('Cannot use --config-dir with --local');
    process.exit(1);
  }

  // Install
  try {
    if (hasGlobal) {
      await install(true, configDir);
    } else if (hasLocal) {
      await install(false);
    } else {
      // Interactive prompt
      const openCodeDir = getOpenCodeConfigDir();
      println(`${colors.yellow}Where would you like to install Tachikoma?${colors.reset}`);
      println();
      println(`  ${colors.cyan}1)${colors.reset} Global ${colors.dim}(${openCodeDir.replace(os.homedir(), '~')})${colors.reset} - available in all projects`);
      println(`  ${colors.cyan}2)${colors.reset} Local  ${colors.dim}(./.opencode)${colors.reset} - this project only`);
      println();

      const answer = await prompt(`  Choice ${colors.dim}[1]${colors.reset}: `);
      
      const isGlobal = answer !== '2';
      await install(isGlobal, configDir);
    }
  } catch (err) {
    error(`Installation failed: ${err.message}`);
    println();
    println(`  ${colors.dim}For help, visit: https://github.com/${REPO_OWNER}/${REPO_NAME}/issues${colors.reset}`);
    process.exit(1);
  }
}

main();
