import { URL } from "node:url";
import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { runCommand } from "../utils/command.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const URL_REGEX = /https?:\/\/\S+/gi;

export async function authLogin(_: object, extra: ToolExtra): Promise<CallToolResult> {
  const logger = buildLogger("auth_login", extra);
  logger.info("auth_login.begin");

  const result = await runCommand("coderabbit", ["auth", "login"], logger, {
    signal: extra.signal,
    timeoutMs: 2 * 60 * 1000,
  });

  const combined = `${result.stdout}\n${result.stderr}`;
  const match = combined.match(URL_REGEX)?.[0];
  let text = combined.trim();

  if (match) {
    try {
      const url = new URL(match.trim());
      text = `ブラウザで次の URL を開いて認証してください:\n${url.toString()}`;
    } catch (error) {
      logger.warning("auth_login.url_parse_failed", { error: String(error), match });
    }
  }

  logger.success("auth_login.completed", { hasUrl: Boolean(match) });
  return { content: [{ type: "text", text }] } satisfies CallToolResult;
}
