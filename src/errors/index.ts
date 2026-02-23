/**
 * Tachikoma error classes
 * Provides structured error handling with error codes
 */

export class TachikomaError extends Error {
  constructor(
    public code: string,
    message: string,
    public details?: unknown,
  ) {
    super(message);
    this.name = this.constructor.name;
    Error.captureStackTrace?.(this, this.constructor);
  }
}

export class ConfigError extends TachikomaError {
  constructor(message: string, details?: unknown) {
    super("CONFIG_ERROR", message, details);
  }
}

export class ValidationError extends TachikomaError {
  constructor(message: string, details?: unknown) {
    super("VALIDATION_ERROR", message, details);
  }
}

export class FileNotFoundError extends TachikomaError {
  constructor(path: string) {
    super("FILE_NOT_FOUND", `File not found: ${path}`, { path });
  }
}

export class RoutingError extends TachikomaError {
  constructor(message: string, details?: unknown) {
    super("ROUTING_ERROR", message, details);
  }
}

export class VerificationError extends TachikomaError {
  constructor(message: string, details?: unknown) {
    super("VERIFICATION_ERROR", message, details);
  }
}

export class RLMError extends TachikomaError {
  constructor(message: string, details?: unknown) {
    super("RLM_ERROR", message, details);
  }
}

/**
 * Type guard for Error instances
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Type guard for TachikomaError instances
 */
export function isTachikomaError(error: unknown): error is TachikomaError {
  return error instanceof TachikomaError;
}
