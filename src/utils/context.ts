import { createLogger, type RequestLogger } from "../logger.js";
import type { ToolExtra } from "../toolContext.js";

export function buildLogger(tool: string, extra: ToolExtra): RequestLogger {
  return createLogger({
    tool,
    requestId: extra.requestId,
    sessionId: extra.sessionId,
  });
}
