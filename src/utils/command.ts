import { execa } from "execa";
import type { RequestLogger } from "../logger.js";
import type { CommandRunOptions, CommandRunResult } from "../types.js";

export async function runCommand(
  command: string,
  args: string[],
  logger: RequestLogger,
  options: CommandRunOptions = {},
): Promise<CommandRunResult> {
  const startedAt = Date.now();
  logger.info("process.spawn", { command, args, cwd: options.cwd, timeoutMs: options.timeoutMs });

  const child = execa(command, args, {
    cwd: options.cwd,
    env: options.env,
    timeout: options.timeoutMs,
    signal: options.signal,
    reject: false,
    all: true,
  });

  const result = await child;
  const durationMs = Date.now() - startedAt;
  const failed = result.exitCode !== 0;

  const payload: CommandRunResult = {
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    combined: result.all ?? undefined,
    exitCode: result.exitCode ?? -1,
    failed,
    durationMs,
  };

  const meta = {
    exitCode: payload.exitCode,
    durationMs: payload.durationMs,
    stdout: payload.stdout,
    stderr: payload.stderr,
    combined: payload.combined,
  };

  if (failed && !options.allowFail) {
    logger.error("process.failed", meta);
    const error = new Error(`${command} exited with code ${payload.exitCode}`);
    (error as Error & { stdout?: string }).stdout = payload.stdout;
    (error as Error & { stderr?: string }).stderr = payload.stderr;
    throw error;
  }

  logger.success("process.completed", meta);
  return payload;
}
