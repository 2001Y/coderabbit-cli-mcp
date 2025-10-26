import os from "node:os";
import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import type { InstallCliInput } from "../types.js";
import { runCommand } from "../utils/command.js";

export const INSTALL_COMMAND = "curl -fsSL https://cli.coderabbit.ai/install.sh | sh";

export async function installCli(args: InstallCliInput, extra: ToolExtra) {
  const logger = buildLogger("install_cli", extra);
  logger.info("install_cli.begin", { args });

  const platform = os.platform();
  if (platform === "win32") {
    const message = `Windows では CodeRabbit CLI は公式サポートされていません。WSL2 上で \`${INSTALL_COMMAND}\` を実行してください。`;
    logger.warning("install_cli.unsupported_platform", { platform });
    return { content: [{ type: "text", text: message }] };
  }

  if (args.dryRun) {
    logger.info("install_cli.dry_run", { command: INSTALL_COMMAND });
    return {
      content: [
        {
          type: "text",
          text: `dryRun=true のため以下を実行予定です:\n${INSTALL_COMMAND}`,
        },
      ],
    };
  }

  const result = await runCommand("sh", ["-c", INSTALL_COMMAND], logger, {
    timeoutMs: 5 * 60 * 1000,
    signal: extra.signal,
  });

  logger.success("install_cli.completed", { stdout: result.stdout });
  return {
    content: [
      {
        type: "text",
        text: result.stdout || "CodeRabbit CLI installation finished.",
      },
    ],
  };
}
