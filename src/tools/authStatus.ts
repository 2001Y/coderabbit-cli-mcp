import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { runCommand } from "../utils/command.js";

export async function authStatus(_: object, extra: ToolExtra) {
  const logger = buildLogger("auth_status", extra);
  logger.info("auth_status.begin");

  const result = await runCommand("coderabbit", ["auth", "status"], logger, {
    signal: extra.signal,
    timeoutMs: 30 * 1000,
  });

  const combined = `${result.stdout}\n${result.stderr}`.trim();
  const match = combined.match(/Logged in as\s+(.*)/i);
  const status = match ? `ログイン済み: ${match[1].trim()}` : combined || "未ログインの可能性があります";

  logger.success("auth_status.completed", { parsed: match?.[1] });
  return { content: [{ type: "text", text: status }] };
}
