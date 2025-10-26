import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { runCommand } from "../utils/command.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

type ParsedFlag = {
  flag: string;
  alias?: string;
  arg?: string;
  description?: string;
};

function parseHelp(helpText: string): ParsedFlag[] {
  const lines = helpText.split(/\r?\n/);
  const flags: ParsedFlag[] = [];
  const regex = /^\s*(?:(-\w)[,\s]*)?--([\w-]+)(?:\s+([<\[].+[>\]]))?\s*(.*)$/;

  for (const line of lines) {
    const match = line.match(regex);
    if (!match) continue;
    const [, alias, longFlag, arg, desc] = match;
    flags.push({
      flag: `--${longFlag}`,
      alias: alias ?? undefined,
      arg: arg?.trim(),
      description: desc?.trim(),
    });
  }

  return flags;
}

export async function cliHelp(_: object, extra: ToolExtra): Promise<CallToolResult> {
  const logger = buildLogger("cli_help", extra);
  logger.info("cli_help.begin");

  const result = await runCommand("coderabbit", ["--help"], logger, {
    signal: extra.signal,
    timeoutMs: 30 * 1000,
  });

  const text = result.stdout || result.combined || result.stderr;
  const flags = parseHelp(text);
  logger.success("cli_help.completed", { parsedCount: flags.length });

  const summary = JSON.stringify(flags, null, 2);
  return {
    content: [
      { type: "text", text: text.trim() },
      { type: "text", text: `parsedFlags=\n${summary}` },
    ],
  } satisfies CallToolResult;
}
