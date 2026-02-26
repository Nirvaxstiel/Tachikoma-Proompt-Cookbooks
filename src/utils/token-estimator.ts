/**
 * Token estimation utility
 * Shared token counter for context management
 */

export interface TokenEstimatorOptions {
  hasCode?: boolean;
}

/**
 * Estimate token count from text
 * Uses improved estimation accounting for code vs prose
 */
export function estimateTokens(text: string, options: TokenEstimatorOptions = {}): number {
  if (!text) return 0;

  const words = text.split(/\s+/).filter(Boolean).length;
  const codePatterns = (text.match(/[{}\[\]()<>:=;,.]/g) || []).length;

  // Detect if text contains code automatically
  const hasCode = options.hasCode ?? /function|class|import|export|const|let|var/.test(text);

  // Different ratios for code vs prose
  const ratio = hasCode ? 0.6 : 0.75;

  return Math.ceil(words / ratio) + Math.ceil(codePatterns * 0.5);
}
