/**
 * Configuration constants
 * Centralized configuration values to avoid magic numbers
 */

export const CONFIG = {
  CONTEXT: {
    MAX_TOKENS: 128000,
    COMPRESSION_THRESHOLD: 0.75,
    SIZE_THRESHOLD: 2000,
  },
  VERIFICATION: {
    MAX_ITERATIONS: 3,
    CONFIDENCE_THRESHOLD: 0.8,
  },
  RLM: {
    CHUNK_SIZE: 50000,
    MAX_CONCURRENT: 5,
    RECURSION_DEPTH: 3,
  },
  POSITION: {
    START_WEIGHT: 1.0,
    MIDDLE_WEIGHT: 0.5,
    END_WEIGHT: 0.95,
    MAX_MIDDLE_RATIO: 0.3,
  },
} as const;
