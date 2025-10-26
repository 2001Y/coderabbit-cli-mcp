import os from "node:os";
import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import type { EnsureCliInput } from "../types.js";
import { runCommand } from "../utils/command.js";
import { installCli, INSTALL_COMMAND } from "./installCli.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const CLI_PATH_HINT = "~/.coderabbit/bin";

async function detectVersion(logger: ReturnType<typeof buildLogger>, extra: ToolExtra) {
  try {
    const result = await runCommand("coderabbit", ["--version"], logger, {
      allowFail: true,
      signal: extra.signal,
    });
    if (!result.failed) {
      return result.stdout.trim() || result.combined?.trim() || "unknown";
    }
  } catch (error) {
    logger.debug("ensure_cli.detect.error", { error: String(error) });
  }
  return null;
}

export async function ensureCli(args: EnsureCliInput, extra: ToolExtra): Promise<CallToolResult> {
  const logger = buildLogger("ensure_cli", extra);
  logger.info("ensure_cli.begin", { args });

  const platform = os.platform();
  if (platform === "win32") {
    const message =
      "Windows ではネイティブ CLI が未サポートです。WSL2 上で CodeRabbit CLI を導入してください。";
    logger.warning("ensure_cli.unsupported_platform", { platform });
    return { content: [{ type: "text", text: message }] } satisfies CallToolResult;
  }

  const detected = await detectVersion(logger, extra);
  if (detected && !args.force) {
    logger.success("ensure_cli.already_installed", { version: detected });
    return {
      content: [
        {
          type: "text",
          text: `CodeRabbit CLI が検出されました (version=${detected}).`,
        },
      ],
    } satisfies CallToolResult;
  }

  if (args.dryRun) {
    logger.info("ensure_cli.dry_run", { reinstall: !detected || args.force });
    return {
      content: [
        {
          type: "text",
          text: `dryRun=true: ${detected ? "再" : ""}インストール手順:\n1. ${INSTALL_COMMAND}\n2. PATH に ${CLI_PATH_HINT} を追加`,
        },
      ],
    } satisfies CallToolResult;
  }

  await installCli({ dryRun: false, force: true }, extra);
  const verified = await detectVersion(logger, extra);
  if (!verified) {
    logger.error("ensure_cli.verify_failed", {});
    throw new Error("CodeRabbit CLI のインストール検証に失敗しました");
  }

  logger.success("ensure_cli.completed", { version: verified });
  return {
    content: [
      {
        type: "text",
        text: `CodeRabbit CLI を準備しました (version=${verified}).`,
      },
    ],
  } satisfies CallToolResult;
}
