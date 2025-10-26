import { randomUUID } from "node:crypto";

export type LogLevel = "INFO" | "DEBUG" | "SUCCESS" | "WARNING" | "ERROR";

export interface LoggerMetadata {
  [key: string]: unknown;
}

export interface LoggerOptions {
  tool: string;
  requestId?: string | number;
  sessionId?: string;
}

export class RequestLogger {
  readonly requestId: string;
  private readonly start = Date.now();

  constructor(private readonly options: LoggerOptions) {
    this.requestId = String(options.requestId ?? randomUUID());
  }

  log(level: LogLevel, message: string, meta?: LoggerMetadata) {
    const payload = {
      timestamp: new Date().toISOString(),
      level,
      tool: this.options.tool,
      requestId: this.requestId,
      sessionId: this.options.sessionId,
      uptimeMs: Date.now() - this.start,
      message,
      meta: meta && Object.keys(meta).length ? meta : undefined,
    };
    process.stderr.write(`${JSON.stringify(payload)}\n`);
  }

  info(message: string, meta?: LoggerMetadata) {
    this.log("INFO", message, meta);
  }

  debug(message: string, meta?: LoggerMetadata) {
    this.log("DEBUG", message, meta);
  }

  success(message: string, meta?: LoggerMetadata) {
    this.log("SUCCESS", message, meta);
  }

  warning(message: string, meta?: LoggerMetadata) {
    this.log("WARNING", message, meta);
  }

  error(message: string, meta?: LoggerMetadata) {
    this.log("ERROR", message, meta);
  }
}

export const createLogger = (options: LoggerOptions) => new RequestLogger(options);
