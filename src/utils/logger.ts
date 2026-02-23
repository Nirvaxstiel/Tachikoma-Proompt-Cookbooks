/**
 * Logging utility
 * Provides structured logging with levels and prefixes
 */

type LogLevel = "debug" | "info" | "warn" | "error";

interface LoggerConfig {
  level: LogLevel;
  prefix?: string;
}

class Logger {
  constructor(private config: LoggerConfig = { level: "info" }) {}

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ["debug", "info", "warn", "error"];
    return levels.indexOf(level) >= levels.indexOf(this.config.level);
  }

  private format(level: LogLevel, message: string, data?: unknown): string {
    const prefix = this.config.prefix ? `[${this.config.prefix}] ` : "";
    const timestamp = new Date().toISOString();
    const dataStr = data ? ` ${JSON.stringify(data)}` : "";
    return `${timestamp} ${prefix}[${level.toUpperCase()}] ${message}${dataStr}`;
  }

  debug(message: string, data?: unknown): void {
    if (this.shouldLog("debug")) {
      console.debug(this.format("debug", message, data));
    }
  }

  info(message: string, data?: unknown): void {
    if (this.shouldLog("info")) {
      console.info(this.format("info", message, data));
    }
  }

  warn(message: string, data?: unknown): void {
    if (this.shouldLog("warn")) {
      console.warn(this.format("warn", message, data));
    }
  }

  error(message: string, error?: unknown): void {
    if (this.shouldLog("error")) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      const stack = error instanceof Error ? error.stack : undefined;
      console.error(this.format("error", message, errorMsg), stack);
    }
  }
}

export const logger = new Logger({
  level: (process.env.LOG_LEVEL as LogLevel) || "info",
  prefix: "tachikoma",
});

export function createLogger(prefix: string): Logger {
  return new Logger({
    level: (process.env.LOG_LEVEL as LogLevel) || "info",
    prefix,
  });
}
