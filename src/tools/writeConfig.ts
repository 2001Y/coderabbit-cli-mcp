import { access, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { resolve } from "node:path";
import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { WriteConfigSchema } from "../types.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";

const TEMPLATE = `# CodeRabbit CLI 設定テンプレート
project:
  name: default
review:
  mode: plain # interactive | plain | prompt-only
  type: uncommitted # all | committed | uncommitted
  max_diffs: 2000
  include:
    - src/**
  exclude:
    - node_modules/**
outputs:
  format: markdown
  verbose: true
`;

export async function writeConfig(rawArgs: unknown, extra: ToolExtra): Promise<CallToolResult> {
  const args = WriteConfigSchema.parse(rawArgs ?? {});
  const targetPath = resolve(args.targetPath ?? ".coderabbit.yaml");
  const logger = buildLogger("write_config", extra);
  logger.info("write_config.begin", { targetPath, force: args.force });

  let exists = false;
  try {
    await access(targetPath, constants.F_OK);
    exists = true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
      throw error;
    }
  }

  if (exists && !args.force) {
    throw new Error(`${targetPath} は既に存在します。force=true を指定してください。`);
  }

  await writeFile(targetPath, TEMPLATE, { encoding: "utf8" });
  logger.success("write_config.completed", { targetPath });

  return {
    content: [
      {
        type: "text",
        text: `${targetPath} にテンプレートを書き出しました。必要に応じて編集してください。`,
      },
    ],
  } satisfies CallToolResult;
}
