#!/usr/bin/env bun
/**
 * Tachikoma Framework Remote Installer
 *
 * Install via:
 *   curl -fsSL https://raw.githubusercontent.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks/main/install.sh | bun
 *
 * Or:
 *   bunx github:Nirvaxstiel/Tachikoma-Proompt-Cookbooks
 *
 * This script:
 * 1. Clones the repo to a temp directory
 * 2. Runs the interactive installer
 * 3. Cleans up
 */

import { $ } from "bun";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { existsSync, rmSync, mkdirSync } from "node:fs";

const REPO_URL = "https://github.com/Nirvaxstiel/Tachikoma-Proompt-Cookbooks";
const REPO_NAME = "Tachikoma-Proompt-Cookbooks";

// Colors for output
const colors = {
  green: "\x1b[38;2;0;255;159m",
  cyan: "\x1b[38;2;38;198;218m",
  text: "\x1b[38;2;179;229;252m",
  muted: "\x1b[38;2;74;95;109m",
  error: "\x1b[38;2;255;0;102m",
  reset: "\x1b[0m",
  bold: "\x1b[1m",
};

function printBanner(): void {
  console.log();

  const banner =
    colors.cyan +
    "████████╗ █████╗  ██████╗██╗  ██╗██╗██╗  ██╗ ██████╗ ███╗   ███╗ █████╗\n" +
    "╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║██║ ██╔╝██╔═══██╗████╗ ████║██╔══██╗\n" +
    "   ██║   ███████║██║     ███████║██║█████╔╝ ██║   ██║██╔████╔██║███████║\n" +
    "   ██║   ██╔══██║██║     ██╔══██║██║██╔═██╗ ██║   ██║██║╚██╔╝██║██╔══██║\n" +
    "   ██║   ██║  ██║╚██████╗██║  ██║██║██║  ██╗╚██████╔╝██║ ╚═╝ ██║██║  ██║\n" +
    "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝\n" +
    colors.reset;

  console.log(banner);
  console.log(`${colors.muted}         「 Remote Installer 」${colors.reset}`);
  console.log();
}

async function main(): Promise<void> {
  printBanner();

  // Create temp directory
  const tempDir = join(tmpdir(), `tachikoma-install-${Date.now()}`);
  mkdirSync(tempDir, { recursive: true });

  console.log(`${colors.cyan}→${colors.reset} ${colors.text}Cloning repository...${colors.reset}`);
  console.log(`${colors.muted}  ${tempDir}${colors.reset}`);
  console.log();

  try {
    // Clone the repository (shallow clone for speed)
    await $`git clone --depth 1 ${REPO_URL} ${tempDir}`.quiet();

    console.log(`${colors.green}✓${colors.reset} ${colors.text}Repository cloned${colors.reset}`);
    console.log();
    console.log(`${colors.cyan}→${colors.reset} ${colors.text}Running installer...${colors.reset}`);
    console.log();

    // Run the installer
    const installerPath = join(tempDir, ".opencode", "cli", "install.ts");
    
    if (!existsSync(installerPath)) {
      throw new Error("Installer not found in repository");
    }

    // Import and run the installer in the temp directory
    // We need to cd to the temp dir so relative paths work
    process.chdir(tempDir);

    // Execute the installer
    await $`bun run ${installerPath}`;

  } catch (err) {
    const error = err as Error;
    console.log();
    console.log(`${colors.error}✗${colors.reset} ${colors.text}Installation failed: ${error.message}${colors.reset}`);
    console.log();
    console.log(`${colors.muted}Try manual installation:${colors.reset}`);
    console.log(`  ${colors.cyan}git clone ${REPO_URL}${colors.reset}`);
    console.log(`  ${colors.cyan}cd ${REPO_NAME}${colors.reset}`);
    console.log(`  ${colors.cyan}bun run .opencode/cli/install.ts${colors.reset}`);
    console.log();
    process.exit(1);
  } finally {
    // Cleanup temp directory
    console.log();
    console.log(`${colors.muted}Cleaning up...${colors.reset}`);
    try {
      rmSync(tempDir, { recursive: true, force: true });
    } catch {
      // Ignore cleanup errors
    }
  }
}

// Run
main();
