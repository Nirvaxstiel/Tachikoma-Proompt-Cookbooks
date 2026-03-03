export function matchesIgnoreCase(text: string, pattern: string): boolean {
  return text.toLowerCase().includes(pattern.toLowerCase());
}

export function normalizeWhitespace(text: string): string {
  return text.replace(/\s+/g, " ").trim();
}

export function truncate(text: string, maxLength: number): string {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3) + "...";
}
