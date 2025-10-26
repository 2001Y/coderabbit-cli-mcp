import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { runCommand } from "../utils/command.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

export async function version(_: object, extra: ToolExtra): Promise<CallToolResult> {
  const logger = buildLogger("version", extra);
  logger.info("version.begin");

  const result = await runCommand("coderabbit", ["--version"], logger, {
    signal: extra.signal,
    timeoutMs: 15 * 1000,
  });

  const text = result.stdout.trim() || result.combined?.trim() || result.stderr.trim();
  logger.success("version.completed", { text });
  return { content: [{ type: "text", text }] } satisfies CallToolResult;
}
