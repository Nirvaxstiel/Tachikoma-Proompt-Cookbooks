/**
 * Token estimation constants
 */

export const TOKEN_ESTIMATION = {
  WORDS_PER_TOKEN_NATURAL: 0.75,
  CODE_PATTERN_TOKEN_MULTIPLIER: 0.5,
} as const;

export const MATCH_THRESHOLD = {
  FUZZY_MATCH_MIN: 0.5,
  FUZZY_MATCH_DEFAULT: 0.8,
} as const;
