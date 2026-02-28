#!/usr/bin/env bun

import fs from "node:fs/promises";
import path from "node:path";
import { confirm, isCancel, select, text } from "@clack/prompts";
import { cyan, dim, green, magenta } from "kolorist";

const BANNER =
  "████████╗ █████╗  ██████╗██╗  ██╗██╗██╗  ██╗ ██████╗ ███╗   ███╗ █████╗\n" +
  "╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║██║ ██╔╝██╔═══██╗████╗ ████║██╔══██╗\n" +
  "   ██║   ███████║██║     ███████║██║█████╔╝ ██║   ██║██╔████╔██║███████║\n" +
  "   ██║   ██╔══██║██║     ██╔══██║██║██╔═██╗ ██║   ██║██║╚██╔╝██║██╔══██║\n" +
  "   ██║   ██║  ██║╚██████╗██║  ██║██║██║  ██╗╚██████╔╝██║ ╚═╝ ██║██║  ██║\n" +
  "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝\n";

const IGNORE_PATTERNS = ["node_modules", "package.json", "bun.lock", ".gitignore", ".DS_Store"];
const OPENCODE_DIR = ".opencode";

let scriptPath = new URL(import.meta.url).pathname;
if (process.platform === "win32" && scriptPath.startsWith("/")) {
  scriptPath = scriptPath.substring(1);
}

const SCRIPT_DIR = path.dirname(scriptPath);
const SRC_DIR = path.join(SCRIPT_DIR, "src");

type InstallMode = "local" | "global" | "custom";

interface InstallOption {
  label: string;
  description: string;
  value: InstallMode;
}

const INSTALL_OPTIONS: InstallOption[] = [
  {
    label: "Local",
    description: ".opencode/ (current project only)",
    value: "local",
  },
  {
    label: "Global",
    description: "~/.config/opencode/ (all projects)",
    value: "global",
  },
  {
    label: "Custom",
    description: "Specify a custom installation path",
    value: "custom",
  },
];

function expandTilde(p: string, home: string): string {
  return p.replace(/^~/, home);
}

function getTargetDir(mode: InstallMode, customPath?: string): string {
  const home = process.env.HOME || process.env.USERPROFILE || "";

  if (mode === "local") return path.join(process.cwd(), OPENCODE_DIR);
  if (mode === "global") return path.join(home, ".config", OPENCODE_DIR);

  const expanded = customPath ? expandTilde(customPath, home) : "";
  return path.join(expanded, OPENCODE_DIR);
}

function shouldIgnore(name: string): boolean {
  return IGNORE_PATTERNS.includes(name);
}

async function backupDir(src: string): Promise<string | null> {
  const stat = await fs.stat(src).catch(() => null);

  if (!stat?.isDirectory()) {
    return null;
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, -5);
  const backupPath = `${src}.backup-${timestamp}`;

  await fs.rename(src, backupPath);
  return backupPath;
}

function updateProgress(current: number, total: number, width = 30): void {
  const percentage = Math.floor((current / total) * 100);
  const filled = Math.floor((current / total) * width);
  const empty = width - filled;

  const bar = "█".repeat(filled) + "░".repeat(empty);
  process.stdout.write(`\r  [${bar}] ${current}/${total} (${percentage}%)`);
}

async function copyDir(
  src: string,
  dest: string,
  total = 0,
  progress: { current: number } = { current: 0 },
): Promise<void> {
  await fs.mkdir(dest, { recursive: true });

  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);

    if (entry.isDirectory()) {
      await copyDir(srcPath, destPath, total, progress);
    } else if (entry.isFile()) {
      await fs.copyFile(srcPath, destPath);
      progress.current += 1;
      if (total > 0) {
        updateProgress(progress.current, total);
      }
    }
  }
}

async function validateSource(): Promise<boolean> {
  const stat = await fs.stat(SRC_DIR).catch(() => null);
  return stat?.isDirectory() ?? false;
}

async function countFiles(src: string): Promise<number> {
  let count = 0;
  const entries = await fs.readdir(src, { withFileTypes: true });

  for (const entry of entries) {
    if (shouldIgnore(entry.name)) {
      continue;
    }

    const srcPath = path.join(src, entry.name);

    if (entry.isDirectory()) {
      count += await countFiles(srcPath);
    } else {
      count += 1;
    }
  }

  return count;
}

async function install() {
  console.log(BANNER);
  console.log("");
  console.log(cyan("📦 Tachikoma Agent Installer"));
  console.log("");

  try {
    const modeOption = await select({
      message: "Where would you like to install Tachikoma?",
      options: INSTALL_OPTIONS,
    });

    if (isCancel(modeOption)) {
      console.error(dim("Installation cancelled"));
      process.exit(0);
    }

    let customPath: string | undefined;

    if (modeOption === "custom") {
      const pathInput = await text({
        message: "Enter installation path:",
        placeholder: "~/my-project or /path/to/install",
      });

      if (isCancel(pathInput)) {
        console.error(dim("Installation cancelled"));
        process.exit(0);
      }

      customPath = pathInput;
    }

    const targetDir = getTargetDir(modeOption, customPath);

    console.log("");
    console.log(cyan("📋 Installation Summary"));
    console.log(`  Target:    ${targetDir}`);
    console.log(`  Mode:      ${modeOption}`);

    const confirmed = await confirm({
      message: "Proceed with installation?",
    });

    if (isCancel(confirmed) || !confirmed) {
      console.error(dim("Installation cancelled"));
      process.exit(0);
    }

    console.log("");
    console.log(cyan("🔄 Installing..."));

    const backupPath = await backupDir(targetDir);

    if (backupPath) {
      console.log(`📦 Backup created: ${backupPath}`);
      console.log("");
    }

    console.log("Copying files...");
    const totalFiles = await countFiles(SRC_DIR);
    const progress = { current: 0 };
    await copyDir(SRC_DIR, targetDir, totalFiles, progress);
    process.stdout.write("\n");

    console.log("");
    console.log(green("✅ Installation complete!"));

    if (backupPath) {
      console.log(`📁 Backup saved to: ${backupPath}`);
      console.log(dim("   Remove it manually if you're satisfied with the installation."));
    }

    console.log("");
    console.log(cyan("🚀 To use Tachikoma:"));
    console.log("");
    console.log("  1. Run 'opencode'");
    console.log("  2. Use '@tachikoma' to invoke the agent");
    console.log("  3. Use 'tachikoma.*' tools for script operations");
    console.log("");
  } catch (error) {
    console.error(magenta("Installation failed"));
    console.error(error);
    process.exit(1);
  }
}

await install();
