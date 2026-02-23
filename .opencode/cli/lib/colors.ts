export const colors = {
  red: '\x1b[0;31m',
  green: '\x1b[0;32m',
  yellow: '\x1b[1;33m',
  blue: '\x1b[0;34m',
  cyan: '\x1b[0;36m',
  magenta: '\x1b[0;35m',
  reset: '\x1b[0m',
  bold: '\x1b[1m',
  dim: '\x1b[2m',
};

export const symbols = {
  check: '[+]',
  warning: '[!]',
  error: '[x]',
  arrow: '->',
};

export function colorize(text: string, color: keyof typeof colors): string {
  return `${colors[color]}${text}${colors.reset}`;
}

export function printHeader(title: string): void {
  const line = '='.repeat(60);
  console.log(`${colors.blue}${line}${colors.reset}`);
  console.log(`${colors.blue}${title}${colors.reset}`);
  console.log(`${colors.blue}${line}${colors.reset}`);
}

export function printSuccess(message: string): void {
  console.log(`${colors.green}${symbols.check}${colors.reset} ${message}`);
}

export function printError(message: string): void {
  console.log(`${colors.red}${symbols.error}${colors.reset} ${message}`);
}

export function printWarning(message: string): void {
  console.log(`${colors.yellow}${symbols.warning}${colors.reset} ${message}`);
}

export function printStep(step: string, message: string): void {
  console.log(`${colors.yellow}${step}${colors.reset} ${message}`);
}
