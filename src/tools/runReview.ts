import { existsSync, statSync } from "node:fs";
import { resolve } from "node:path";
import { buildLogger } from "../utils/context.js";
import type { ToolExtra } from "../toolContext.js";
import { reportPhase } from "../progress.js";
import { runCommand } from "../utils/command.js";
import { saveOutput } from "../resources/outputsStore.js";
import { RunReviewInputSchema, DEFAULT_TIMEOUT_SEC } from "../types.js";
import type { RunReviewInput } from "../types.js";

function ensureConfigFiles(files: string[] | undefined) {
  if (!files?.length) return [];
  return files.map((file) => {
    const absolute = resolve(file);
    if (!existsSync(absolute) || !statSync(absolute).isFile()) {
      throw new Error(`config file not found: ${absolute}`);
    }
    return absolute;
  });
}

function buildCliArgs(args: Required<Pick<RunReviewInput, "mode" | "type" | "base" | "baseCommit" | "cwd" | "configFiles" | "noColor" | "extraArgs">>) {
  const cliArgs: string[] = [];

  if (args.mode === "plain") cliArgs.push("--plain");
  if (args.mode === "prompt-only") cliArgs.push("--prompt-only");

  if (args.type && args.type !== "all") cliArgs.push("--type", args.type);
  if (args.base) cliArgs.push("--base", args.base);
  if (args.baseCommit) cliArgs.push("--base-commit", args.baseCommit);
  if (args.cwd) cliArgs.push("--cwd", resolve(args.cwd));
  if (args.noColor) cliArgs.push("--no-color");

  for (const file of args.configFiles ?? []) {
    cliArgs.push("-c", file);
  }

  if (args.extraArgs.length) cliArgs.push(...args.extraArgs);
  return cliArgs;
}

export async function runReview(rawArgs: RunReviewInput, extra: ToolExtra) {
  const parsed = RunReviewInputSchema.parse(rawArgs);
  const normalized = {
    mode: parsed.mode ?? "plain",
    type: parsed.type ?? "all",
    base: parsed.base ?? "",
    baseCommit: parsed.baseCommit ?? "",
    cwd: parsed.cwd ?? process.cwd(),
    configFiles: ensureConfigFiles(parsed.configFiles),
    noColor: parsed.noColor ?? false,
    timeoutSec: parsed.timeoutSec ?? DEFAULT_TIMEOUT_SEC,
    extraArgs: parsed.extraArgs ?? [],
  };

  const logger = buildLogger("run_review", extra);
  logger.info("run_review.begin", { normalized });

  if (!existsSync(normalized.cwd)) {
    throw new Error(`cwd not found: ${normalized.cwd}`);
  }

  const cliArgs = buildCliArgs(normalized);
  await reportPhase(extra, "boot");

  const timeoutMs = normalized.timeoutSec * 1000;
  await reportPhase(extra, "scanning");
  const result = await runCommand("coderabbit", cliArgs, logger, {
    cwd: normalized.cwd,
    timeoutMs,
    signal: extra.signal,
  });

  await reportPhase(extra, "analyzing");
  const textOutput = result.combined?.trim() || [result.stdout, result.stderr].filter(Boolean).join("\n").trim();
  const cleaned = textOutput || "(CodeRabbit CLI からの出力は空でした)";
  const uri = saveOutput({
    text: cleaned,
    tool: "run_review",
    requestId: logger.requestId,
    summary: `${normalized.mode}/${normalized.type}`,
  });

  await reportPhase(extra, "formatting");
  await reportPhase(extra, "done");
  logger.success("run_review.completed", { uri });

  return {
    content: [
      { type: "text", text: cleaned },
      { type: "text", text: `report: ${uri}` },
    ],
  };
}
