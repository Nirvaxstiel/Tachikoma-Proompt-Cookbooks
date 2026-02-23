#!/usr/bin/env bun
/**
 * Prompt utilities for Tachikoma CLI
 * Simple wrapper around bun-promptx with Ghost in the Shell theming
 */

// Ghost in the Shell theme colors (ANSI)
export const theme = {
  // Primary colors
  green: "\x1b[38;2;0;255;159m", // #00ff9f
  cyan: "\x1b[38;2;38;198;218m", // #26c6da
  teal: "\x1b[38;2;0;212;170m", // #00d4aa

  // Semantic colors
  error: "\x1b[38;2;255;0;102m", // #ff0066
  warning: "\x1b[38;2;255;167;38m", // #ffa726

  // Text colors
  text: "\x1b[38;2;179;229;252m", // #b3e5fc
  muted: "\x1b[38;2;74;95;109m", // #4a5f6d
  dim: "\x1b[38;2;107;142;158m", // #6b8e9e

  // Background colors
  bg0: "\x1b[48;2;10;14;20m", // #0a0e14
  bg1: "\x1b[48;2;13;17;23m", // #0d1117
  bg2: "\x1b[48;2;19;23;31m", // #13171f

  // Modifiers
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  italic: "\x1b[3m",
  underline: "\x1b[4m",

  // Special
  clear: "\x1b[2J\x1b[H",
  hideCursor: "\x1b[?25l",
  showCursor: "\x1b[?25h",
};

// Unicode symbols for cyberpunk aesthetic
export const symbols = {
  // Structural
  cornerTL: "╔",
  cornerTR: "╗",
  cornerBL: "╚",
  cornerBR: "╝",
  horizontal: "═",
  vertical: "║",
  cross: "╬",
  teeRight: "╠",
  teeLeft: "╣",

  // Decorative
  diamond: "◆",
  bullet: "●",
  circle: "○",
  star: "★",
  sparkle: "✦",

  // Status
  check: "✓",
  cross: "✗",
  arrow: "→",
  arrowDown: "↓",
  arrowUp: "↑",
  pointer: "❯",
  pointerHollow: "◇",

  // Tech
  bracketL: "「",
  bracketR: "」",
  braceL: "｛",
  braceR: "｝",
  angleL: "‹",
  angleR: "›",

  // Progress
  block: "█",
  blockLight: "░",
  blockMedium: "▒",
  blockDark: "▓",

  // Misc
  ellipsis: "⋯",
  separator: "─",
};

/**
 * Colorize text with a theme color
 */
export function colorize(text: string, color: keyof typeof theme): string {
  const code = theme[color];
  if (!code || code === theme.reset) return text;
  return `${code}${text}${theme.reset}`;
}

/**
 * Print the Tachikoma banner
 */
export function printBanner(): void {
  console.log();

  const banner =
    theme.cyan +
    "████████╗ █████╗  ██████╗██╗  ██╗██╗██╗  ██╗ ██████╗ ███╗   ███╗ █████╗\n" +
    "╚══██╔══╝██╔══██╗██╔════╝██║  ██║██║██║ ██╔╝██╔═══██╗████╗ ████║██╔══██╗\n" +
    "   ██║   ███████║██║     ███████║██║█████╔╝ ██║   ██║██╔████╔██║███████║\n" +
    "   ██║   ██╔══██║██║     ██╔══██║██║██╔═██╗ ██║   ██║██║╚██╔╝██║██╔══██║\n" +
    "   ██║   ██║  ██║╚██████╗██║  ██║██║██║  ██╗╚██████╔╝██║ ╚═╝ ██║██║  ██║\n" +
    "   ╚═╝   ╚═╝  ╚═╝ ╚═════╝╚═╝  ╚═╝╚═╝╚═╝  ╚═╝ ╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝\n" +
    theme.reset;

  console.log(banner);
  console.log(`${theme.muted}         「 Structure at the start, freedom at the end 」${theme.reset}`);
  console.log();
}

/**
 * Print a section header
 */
export function printHeader(title: string): void {
  const line = symbols.horizontal.repeat(50);
  console.log();
  console.log(`${theme.cyan}${symbols.cornerTL}${line}${symbols.cornerTR}${theme.reset}`);
  console.log(
    `${theme.cyan}${symbols.vertical}${theme.reset} ${theme.text}${theme.bold}${title.padEnd(48)}${theme.reset} ${theme.cyan}${symbols.vertical}${theme.reset}`,
  );
  console.log(`${theme.cyan}${symbols.cornerBL}${line}${symbols.cornerBR}${theme.reset}`);
  console.log();
}

/**
 * Print a status message
 */
export function printStatus(
  message: string,
  type: "success" | "error" | "warning" | "info" = "info",
): void {
  const icons = {
    success: `${theme.green}${symbols.check}${theme.reset}`,
    error: `${theme.error}${symbols.cross}${theme.reset}`,
    warning: `${theme.warning}${symbols.star}${theme.reset}`,
    info: `${theme.cyan}${symbols.diamond}${theme.reset}`,
  };

  console.log(`  ${icons[type]} ${theme.text}${message}${theme.reset}`);
}

/**
 * Print a step in a process
 */
export function printStep(step: string, message: string): void {
  console.log(
    `  ${theme.teal}${theme.bold}${step}${theme.reset} ${theme.text}${message}${theme.reset}`,
  );
}

/**
 * Print a path with styling
 */
export function printPath(label: string, path: string): void {
  console.log(
    `  ${theme.muted}${symbols.arrow}${theme.reset} ${theme.dim}${label}:${theme.reset} ${theme.cyan}${path}${theme.reset}`,
  );
}

/**
 * Print a simple progress indicator
 */
export function printProgress(current: number, total: number, message: string): void {
  const percent = Math.round((current / total) * 100);
  const filled = Math.round((current / total) * 20);
  const empty = 20 - filled;
  const bar = `${theme.green}${symbols.block.repeat(filled)}${theme.reset}${theme.dim}${symbols.blockLight.repeat(empty)}${theme.reset}`;

  // Clear line and print progress
  process.stdout.write(`\r\x1b[2K  ${bar} ${theme.text}${percent}%${theme.reset} ${theme.muted}${message}${theme.reset}`);
}

/**
 * Complete progress (newline)
 */
export function progressComplete(): void {
  console.log();
}

/**
 * Simple prompt for text input (fallback if bun-promptx unavailable)
 */
export async function promptText(
  question: string,
  defaultValue = "",
): Promise<string> {
  const hint = defaultValue ? ` [${defaultValue}]` : "";
  process.stdout.write(`  ${theme.cyan}${symbols.pointer}${theme.reset} ${theme.text}${question}${hint}: ${theme.reset}`);

  for await (const line of console) {
    const answer = line.trim();
    return answer || defaultValue;
  }

  return defaultValue;
}

/**
 * Simple select prompt (fallback if bun-promptx unavailable)
 */
export async function promptSelect<T extends string>(
  question: string,
  options: Array<{ value: T; label: string; description?: string }>,
): Promise<T> {
  console.log();
  console.log(`  ${theme.cyan}${symbols.pointer}${theme.reset} ${theme.text}${question}${theme.reset}`);
  console.log();

  // Print options
  for (let i = 0; i < options.length; i++) {
    const opt = options[i];
    const num = `${theme.dim}${i + 1}.${theme.reset}`;
    const desc = opt.description ? ` ${theme.muted}${opt.description}${theme.reset}` : "";
    console.log(`    ${num} ${theme.text}${opt.label}${theme.reset}${desc}`);
  }

  console.log();

  // Get selection
  const defaultChoice = options[0].value;
  process.stdout.write(`  ${theme.muted}Enter choice [1-${options.length}]:${theme.reset} `);

  for await (const line of console) {
    const input = line.trim();
    if (!input) return defaultChoice;

    const num = parseInt(input, 10);
    if (num >= 1 && num <= options.length) {
      return options[num - 1].value;
    }

    process.stdout.write(`  ${theme.error}Invalid choice. Try again:${theme.reset} `);
  }

  return defaultChoice;
}

/**
 * Simple confirm prompt
 */
export async function promptConfirm(question: string, defaultValue = true): Promise<boolean> {
  const hint = defaultValue ? "[Y/n]" : "[y/N]";
  process.stdout.write(`  ${theme.cyan}${symbols.pointer}${theme.reset} ${theme.text}${question} ${theme.dim}${hint}:${theme.reset} `);

  for await (const line of console) {
    const answer = line.trim().toLowerCase();

    if (answer === "") return defaultValue;
    if (["y", "yes"].includes(answer)) return true;
    if (["n", "no"].includes(answer)) return false;

    process.stdout.write(`  ${theme.error}Please enter y or n:${theme.reset} `);
  }

  return defaultValue;
}

/**
 * Clear the terminal
 */
export function clearScreen(): void {
  console.log(theme.clear);
}

/**
 * Exit with message
 */
export function exitWithMessage(message: string, code = 0): never {
  console.log();
  if (code === 0) {
    printStatus(message, "success");
  } else {
    printStatus(message, "error");
  }
  console.log();
  process.exit(code);
}
