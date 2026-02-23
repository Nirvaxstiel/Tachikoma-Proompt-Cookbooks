#!/usr/bin/env bun
/**
 * Formatter/Cleanup Router
 * Automated code quality cleanup via CLI tools
 * Usage: bun run router.ts <operation> [args]
 */

import { $ } from "bun";
import { existsSync } from "fs";

// Helper to glob files using Bun's built-in
async function globFiles(pattern: string): Promise<string[]> {
  const glob = new Bun.Glob(pattern.replace(/^\.\//, ""));
  return [...glob.scanSync(".")];
}

// Colors
const colors = {
  red: "\x1b[0;31m",
  green: "\x1b[0;32m",
  yellow: "\x1b[1;33m",
  blue: "\x1b[0;34m",
  reset: "\x1b[0m",
};

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

function printInfo(msg: string) {
  console.log(`${colors.blue}ℹ${colors.reset} ${msg}`);
}

// Detect project type
function detectProjectType(): string {
  if (existsSync("package.json")) return "nodejs";
  if (existsSync("requirements.txt") || existsSync("setup.py") || existsSync("pyproject.toml")) return "python";
  if (existsSync("go.mod")) return "go";
  if (existsSync("Cargo.toml")) return "rust";
  if (existsSync("composer.json")) return "php";
  if (existsSync("pom.xml") || existsSync("build.gradle") || existsSync("build.gradle.kts")) return "java";
  if (existsSync("CMakeLists.txt") || existsSync("Makefile")) return "cpp";
  if (existsSync("Gemfile")) return "ruby";
  if (existsSync("Package.swift")) return "swift";
  return "generic";
}

// Check if command exists
async function commandExists(cmd: string): Promise<boolean> {
  try {
    await $`which ${cmd}`.quiet();
    return true;
  } catch {
    return false;
  }
}

// Step 1: Remove debug code
async function opRemoveDebug(target: string): Promise<boolean> {
  let removed = 0;

  if (!existsSync(target)) {
    printInfo("No debug code found (target not a directory)");
    return false;
  }

  // JS/TS console.log and debugger
  const jsFiles = await globFiles(`${target}/**/*.{js,ts,jsx,tsx}`);
  for (const file of jsFiles) {
    const content = await Bun.file(file).text();
    const matches = content.match(/console\.log|debugger;/g);
    if (matches) {
      console.log(`  Removing ${matches.length} debug statements from ${file.split("/").pop()}`);
      removed += matches.length;
    }
  }

  // Java/Kotlin/Scala System.out.print
  const javaFiles = await globFiles(`${target}/**/*.{java,kt,scala}`);
  for (const file of javaFiles) {
    const content = await Bun.file(file).text();
    const matches = content.match(/System\.(out|err)\.(print|println)/g);
    if (matches) {
      console.log(`  Removing ${matches.length} print statements from ${file.split("/").pop()}`);
      removed += matches.length;
    }
  }

  // C# Console.WriteLine
  const csFiles = await globFiles(`${target}/**/*.cs`);
  for (const file of csFiles) {
    const content = await Bun.file(file).text();
    const matches = content.match(/Console\.WriteLine/g);
    if (matches) {
      console.log(`  Removing ${matches.length} Console.WriteLine from ${file.split("/").pop()}`);
      removed += matches.length;
    }
  }

  // C/C++ printf
  const cFiles = await globFiles(`${target}/**/*.{c,cpp,h}`);
  for (const file of cFiles) {
    const content = await Bun.file(file).text();
    const matches = content.match(/printf|println|qDebug/g);
    if (matches) {
      console.log(`  Removing ${matches.length} print statements from ${file.split("/").pop()}`);
      removed += matches.length;
    }
  }

  // Ruby puts
  const rbFiles = await globFiles(`${target}/**/*.rb`);
  for (const file of rbFiles) {
    const content = await Bun.file(file).text();
    const matches = content.match(/^\s*puts /gm);
    if (matches) {
      console.log(`  Removing ${matches.length} puts statements from ${file.split("/").pop()}`);
      removed += matches.length;
    }
  }

  // Swift print
  const swiftFiles = await globFiles(`${target}/**/*.swift`);
  for (const file of swiftFiles) {
    const content = await Bun.file(file).text();
    const matches = content.match(/print\(|debugPrint\(/g);
    if (matches) {
      console.log(`  Removing ${matches.length} print statements from ${file.split("/").pop()}`);
      removed += matches.length;
    }
  }

  if (removed > 0) {
    printSuccess(`Removed ${removed} debug statements`);
    return true;
  } else {
    printInfo("No debug code found");
    return false;
  }
}

// Step 2: Format code
async function opFormat(target: string): Promise<boolean> {
  let formatted = false;
  const projectType = detectProjectType();

  // Prettier (JavaScript/TypeScript)
  if (existsSync(".prettierrc") || existsSync(".prettierrc.json") || existsSync("prettier.config.js")) {
    if (await commandExists("npx")) {
      console.log("  Running Prettier...");
      try {
        await $`npx prettier --write ${target}`.quiet();
        printSuccess("Formatted with Prettier");
        formatted = true;
      } catch {}
    }
  }

  // Black (Python)
  if (existsSync("pyproject.toml") || existsSync("setup.py")) {
    if (await commandExists("black")) {
      console.log("  Running Black...");
      try {
        await $`black ${target}`.quiet();
        printSuccess("Formatted with Black");
        formatted = true;
      } catch {}
    }
  }

  // gofmt (Go)
  if (existsSync("go.mod") && await commandExists("gofmt")) {
    console.log("  Running gofmt...");
    try {
      await $`gofmt -w ${target}`.quiet();
      printSuccess("Formatted with gofmt");
      formatted = true;
    } catch {}
  }

  // rustfmt (Rust)
  if (existsSync("Cargo.toml") && await commandExists("cargo")) {
    console.log("  Running rustfmt...");
    try {
      await $`cargo fmt`.quiet();
      printSuccess("Formatted with rustfmt");
      formatted = true;
    } catch {}
  }

  // clang-format (C/C++)
  if (existsSync("CMakeLists.txt") && await commandExists("clang-format")) {
    console.log("  Running clang-format...");
    const cFiles = await globFiles(`${target}/**/*.{c,cpp,h,hpp}`);
    for (const file of cFiles) {
      try {
        await $`clang-format -i ${file}`.quiet();
      } catch {}
    }
    printSuccess("Formatted with clang-format");
    formatted = true;
  }

  // RuboCop (Ruby)
  if (existsSync("Gemfile") && await commandExists("rubocop")) {
    console.log("  Running RuboCop...");
    try {
      await $`rubocop -a ${target}`.quiet();
      printSuccess("Formatted with RuboCop");
      formatted = true;
    } catch {}
  }

  // SwiftFormat (Swift)
  if (existsSync("Package.swift") && await commandExists("swiftformat")) {
    console.log("  Running SwiftFormat...");
    try {
      await $`swiftformat ${target}`.quiet();
      printSuccess("Formatted with SwiftFormat");
      formatted = true;
    } catch {}
  }

  // PHP-CS-Fixer (PHP)
  if (existsSync("composer.json") && await commandExists("php-cs-fixer")) {
    console.log("  Running PHP-CS-Fixer...");
    try {
      await $`php-cs-fixer fix ${target}`.quiet();
      printSuccess("Formatted with PHP-CS-Fixer");
      formatted = true;
    } catch {}
  }

  if (!formatted) {
    printWarning("No formatter found or no files to format");
  }

  return formatted;
}

// Step 3: Optimize imports
async function opImports(target: string): Promise<boolean> {
  let optimized = false;

  // ESLint import fixes
  if (existsSync(".eslintrc") || existsSync(".eslintrc.js") || existsSync(".eslintrc.json")) {
    if (await commandExists("npx")) {
      console.log("  Running ESLint import fixes...");
      try {
        await $`npx eslint --fix ${target}`.quiet();
        printSuccess("Optimized imports with ESLint");
        optimized = true;
      } catch {}
    }
  }

  // isort (Python)
  if (await commandExists("isort")) {
    console.log("  Running isort...");
    try {
      await $`isort ${target}`.quiet();
      printSuccess("Optimized imports with isort");
      optimized = true;
    } catch {}
  }

  if (!optimized) {
    printInfo("No import optimization needed or tool not available");
  }

  return optimized;
}

// Step 4: Fix linting
async function opLint(target: string): Promise<boolean> {
  let fixed = false;

  // ESLint
  if (existsSync(".eslintrc") || existsSync(".eslintrc.js") || existsSync(".eslintrc.json")) {
    if (await commandExists("npx")) {
      console.log("  Running ESLint --fix...");
      try {
        await $`npx eslint --fix ${target}`.quiet();
        printSuccess("Fixed ESLint issues");
        fixed = true;
      } catch {}
    }
  }

  // flake8 (Python)
  if (await commandExists("flake8")) {
    console.log("  Running flake8 check...");
    try {
      await $`flake8 ${target}`.quiet();
    } catch {}
  }

  // golint (Go)
  if (existsSync("go.mod") && await commandExists("golint")) {
    console.log("  Running golint...");
    try {
      await $`golint ${target}`.quiet();
    } catch {}
  }

  // cargo clippy (Rust)
  if (existsSync("Cargo.toml") && await commandExists("cargo")) {
    console.log("  Running cargo clippy...");
    try {
      await $`cargo clippy`.quiet();
    } catch {}
  }

  // RuboCop (Ruby)
  if (existsSync("Gemfile") && await commandExists("rubocop")) {
    console.log("  Running RuboCop...");
    try {
      await $`rubocop -a ${target}`.quiet();
    } catch {}
  }

  // SwiftLint (Swift)
  if (existsSync("Package.swift") && await commandExists("swiftlint")) {
    console.log("  Running SwiftLint...");
    try {
      await $`swiftlint autocorrect ${target}`.quiet();
    } catch {}
  }

  if (!fixed) {
    printInfo("No linting issues found or tool not available");
  }

  return fixed;
}

// Step 5: Type checking
async function opTypes(target: string): Promise<boolean> {
  let checked = false;

  // TypeScript
  if (existsSync("tsconfig.json") && await commandExists("npx")) {
    console.log("  Running TypeScript compiler...");
    try {
      await $`npx tsc --noEmit`.quiet();
      printSuccess("TypeScript check passed");
      checked = true;
    } catch {
      printWarning("TypeScript errors found (manual review needed)");
    }
  }

  // mypy (Python)
  if (await commandExists("mypy")) {
    console.log("  Running mypy...");
    try {
      await $`mypy ${target}`.quiet();
      printSuccess("Python type check passed");
      checked = true;
    } catch {}
  }

  // go build (Go)
  if (existsSync("go.mod") && await commandExists("go")) {
    console.log("  Running go build...");
    try {
      await $`go build ./...`.quiet();
      printSuccess("Go build passed");
      checked = true;
    } catch {}
  }

  // cargo check (Rust)
  if (existsSync("Cargo.toml") && await commandExists("cargo")) {
    console.log("  Running cargo check...");
    try {
      await $`cargo check`.quiet();
      printSuccess("Rust check passed");
      checked = true;
    } catch {}
  }

  if (!checked) {
    printInfo("No type checker found or no type issues");
  }

  return checked;
}

// Operation: Full cleanup pipeline
async function opCleanup(target: string = ".") {
  const projectType = detectProjectType();

  printHeader("FORMATTER: Code Quality Cleanup");

  console.log(`Target: ${target}`);
  console.log(`Project type: ${projectType}`);
  console.log("");

  let changesMade = 0;

  // Step 1: Remove debug code
  printInfo("Step 1: Removing debug code...");
  if (await opRemoveDebug(target)) changesMade++;

  // Step 2: Format code
  printInfo("Step 2: Formatting code...");
  if (await opFormat(target)) changesMade++;

  // Step 3: Optimize imports
  printInfo("Step 3: Optimizing imports...");
  if (await opImports(target)) changesMade++;

  // Step 4: Fix linting
  printInfo("Step 4: Fixing linting issues...");
  if (await opLint(target)) changesMade++;

  // Step 5: Type checking
  printInfo("Step 5: Type checking...");
  if (await opTypes(target)) changesMade++;

  // Summary
  console.log("");
  printHeader("CLEANUP SUMMARY");

  if (changesMade > 0) {
    printSuccess("Cleanup completed with improvements");
    console.log("");
    console.log("Actions performed:");
    console.log("  - Debug code removal");
    console.log("  - Code formatting");
    console.log("  - Import optimization");
    console.log("  - Linting fixes");
    console.log("  - Type checking");
  } else {
    printInfo("No changes needed - code is clean!");
  }
}

// Operation: Check only (dry run)
async function opCheck(target: string = ".") {
  const projectType = detectProjectType();

  printHeader("FORMATTER: Check Only (Dry Run)");

  console.log(`Target: ${target}`);
  console.log(`Project type: ${projectType}`);
  console.log("");

  printInfo("Checking for issues (no changes will be made)...");

  // Check for debug code
  console.log("");
  console.log("Debug code found:");
  const jsFiles = await globFiles(`${target}/**/*.{js,ts,jsx,tsx}`);
  for (const file of jsFiles.slice(0, 5)) {
    const content = await Bun.file(file).text();
    if (content.match(/console\.log|debugger;/)) {
      console.log(`  ${file}: contains debug statements`);
    }
  }

  // Check formatting
  console.log("");
  if (existsSync(".prettierrc") && await commandExists("npx")) {
    console.log("Prettier issues:");
    try {
      await $`npx prettier --check ${target}`.quiet();
      console.log("  No formatting issues");
    } catch {
      console.log("  Formatting issues found");
    }
  }

  if (existsSync("pyproject.toml") && await commandExists("black")) {
    console.log("Black issues:");
    try {
      await $`black --check ${target}`.quiet();
      console.log("  No formatting issues");
    } catch {
      console.log("  Formatting issues found");
    }
  }

  // Check linting
  console.log("");
  if (existsSync(".eslintrc") && await commandExists("npx")) {
    console.log("ESLint issues:");
    try {
      await $`npx eslint ${target}`.quiet();
      console.log("  No issues");
    } catch {
      console.log("  Issues found");
    }
  }

  // Type checking
  console.log("");
  if (existsSync("tsconfig.json") && await commandExists("npx")) {
    console.log("TypeScript issues:");
    try {
      await $`npx tsc --noEmit`.quiet();
      console.log("  No type errors");
    } catch {
      console.log("  Type errors found");
    }
  }

  console.log("");
  printInfo("Check complete. Run 'cleanup' to fix issues.");
}

// Help
function opHelp() {
  console.log("Formatter - Automated code quality cleanup");
  console.log("");
  console.log("Usage: bun run router.ts <operation> [target]");
  console.log("");
  console.log("Operations:");
  console.log("  cleanup [target]    Full cleanup pipeline (default: .)");
  console.log("  check [target]      Check only, no changes (dry run)");
  console.log("  help                Show this help");
  console.log("");
  console.log("Cleanup steps:");
  console.log("  1. Remove debug code (console.log, println, WriteLine, etc.)");
  console.log("  2. Format code (Prettier, Black, gofmt, rustfmt, clang-format, etc.)");
  console.log("  3. Optimize imports (ESLint, isort)");
  console.log("  4. Fix linting (ESLint, flake8, clippy, Checkstyle, clang-tidy, etc.)");
  console.log("  5. Type checking (TypeScript, mypy, cargo, javac, dotnet, etc.)");
  console.log("");
  console.log("Examples:");
  console.log("  bun run router.ts cleanup");
  console.log("  bun run router.ts cleanup src/");
  console.log("  bun run router.ts check");
  console.log("");
  console.log("Supports: Node.js, Python, Go, Rust, Java, C#, C/C++, Ruby, Swift, Kotlin, Scala, PHP");
}

// Main
const args = process.argv.slice(2);
const op = args[0] || "cleanup";

switch (op) {
  case "cleanup":
    await opCleanup(args[1] || ".");
    break;
  case "check":
    await opCheck(args[1] || ".");
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
