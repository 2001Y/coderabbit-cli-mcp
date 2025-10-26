import { resolve } from "node:path";
import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { DoctorSchema } from "../types.js";
import { runCommand } from "../utils/command.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const CLI_PATH_HINT = "~/.coderabbit/bin";

export async function doctor(rawArgs: unknown, extra: ToolExtra): Promise<CallToolResult> {
  const args = DoctorSchema.parse(rawArgs ?? {});
  const cwd = resolve(args.cwd ?? process.cwd());
  const logger = buildLogger("doctor", extra);
  logger.info("doctor.begin", { cwd });

  const sections: string[] = [];

  const gitVersion = await runCommand("git", ["--version"], logger, {
    allowFail: true,
    signal: extra.signal,
    cwd,
  });
  if (gitVersion.failed) {
    sections.push("Git: 未インストールです (git --version が失敗)");
  } else {
    sections.push(`Git: ${gitVersion.stdout.trim()}`);
  }

  const repoRoot = await runCommand("git", ["rev-parse", "--show-toplevel"], logger, {
    allowFail: true,
    signal: extra.signal,
    cwd,
  });
  if (repoRoot.failed) {
    sections.push("Git リポジトリ: ここはリポジトリ直下ではありません");
  } else {
    sections.push(`Git リポジトリ: ${repoRoot.stdout.trim()}`);
    const status = await runCommand("git", ["status", "--short"], logger, {
      allowFail: true,
      signal: extra.signal,
      cwd,
    });
    sections.push(`Git 状態: ${status.stdout.trim() ? "未コミット差分あり" : "クリーン"}`);
  }

  const cliVersion = await runCommand("coderabbit", ["--version"], logger, {
    allowFail: true,
    signal: extra.signal,
    cwd,
  });
  if (cliVersion.failed) {
    sections.push("CodeRabbit CLI: 未検出。/mcp call ensure_cli で導入できます");
  } else {
    sections.push(`CodeRabbit CLI: ${cliVersion.stdout.trim()}`);
  }

  const pathVar = process.env.PATH ?? "";
  if (!pathVar.split(":").some((segment) => segment.includes(".coderabbit"))) {
    sections.push(`PATH: ${CLI_PATH_HINT} を PATH に追加すると CLI の検出が安定します`);
  } else {
    sections.push("PATH: `.coderabbit/bin` が含まれています");
  }

  const text = sections.join("\n");
  logger.success("doctor.completed");
  return { content: [{ type: "text", text }] } satisfies CallToolResult;
}
