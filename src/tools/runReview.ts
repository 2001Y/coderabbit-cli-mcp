import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { execa } from 'execa';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import { resolveCoderabbitBinary } from '../lib/coderabbit.js';
import { createLogger, createStopwatch } from '../logger.js';
import type { ToolContext } from '../types.js';
import { sendProgress } from '../progress.js';
import { storeReport } from '../resources/outputsStore.js';
import { buildInstallGuide } from './installGuide.js';
import { getRunReviewConfig, type RunReviewConfigSection } from '../config.js';

const USER_ESCALATION_NOTE = 'Codex must stop here, report the situation to the requesting user, and wait for further instructions.';
const CONFIG_FILES_WARNING = 'Recommended option CODERRABBIT_MCP_LOCK_CONFIG_FILES is not set. You may point to custom review config files, or simply pass agents.md to capture project guidance—please configure it.';
const TOOL_TIMEOUT_WARNING = 'tool_timeout_sec appears unset or too low (reviews can take 7–30+ minutes). Increase tool_timeout_sec in ~/.codex/config.toml to at least 1200 seconds and mirror the value in CODERRABBIT_TOOL_TIMEOUT_SEC.';

const log = createLogger('tools.run_review');

export const RunReviewArgsSchema = z.object({
  mode: z.enum(['interactive', 'plain', 'prompt-only']).default('plain'),
  type: z.enum(['all', 'committed', 'uncommitted']).default('all').optional(),
  base: z.string().optional(),
  baseCommit: z.string().optional(),
  cwd: z.string().optional(),
  extraArgs: z.array(z.string()).optional()
});

export type RunReviewArgs = z.infer<typeof RunReviewArgsSchema> & {
  configFiles?: string[];
};

function buildArgv(parsed: RunReviewArgs): string[] {
  const args: string[] = [];
  const mode = parsed.mode ?? 'plain';
  if (mode === 'plain') args.push('--plain');
  if (mode === 'prompt-only') args.push('--prompt-only');

  const reviewType = parsed.type ?? 'all';
  args.push('--type', reviewType);

  if (parsed.base) args.push('--base', parsed.base);
  if (parsed.baseCommit) args.push('--base-commit', parsed.baseCommit);
  args.push('--no-color');
  if (parsed.cwd) args.push('--cwd', resolve(parsed.cwd));

  if (parsed.configFiles?.length) {
    for (const file of parsed.configFiles) {
      const path = resolve(file);
      if (!existsSync(path)) {
        throw new Error(`config file not found: ${path}`);
      }
      args.push('-c', path);
    }
  }

  if (parsed.extraArgs?.length) {
    args.push(...parsed.extraArgs);
  }

  return args;
}

export async function runReview(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult> {
  const parsedArgs = RunReviewArgsSchema.parse(rawArgs ?? {});
  const config = getRunReviewConfig();
  const warnings = collectWarnings(config);
  const argsWithDefaults = applyConfigDefaults(parsedArgs, config);
  const { args: args, overrides } = applyConfigLocks(argsWithDefaults, config);
  for (const override of overrides) {
    void log.info('run_review option locked', override);
  }

  const stopwatch = createStopwatch();
  const argv = buildArgv(args);
  const cwd = args.cwd ? resolve(args.cwd) : process.cwd();
  if (args.cwd) {
    if (!existsSync(cwd) || !statSync(cwd).isDirectory()) {
      throw new Error(`cwd not found: ${cwd}`);
    }
  }

  await log.info('starting coderabbit run_review', { argv, cwd });
  await sendProgress(ctx, { progress: 5, total: 100, message: 'boot' });

  let binary: string;
  try {
    binary = await resolveCoderabbitBinary();
  } catch (error) {
    const guide = buildInstallGuide();
    await log.error('coderabbit binary missing', { reason: (error as Error).message });
    throw new Error([
      'CodeRabbit CLI was not found on PATH.',
      `Details: ${(error as Error).message}`,
      '',
      guide,
      '',
      USER_ESCALATION_NOTE
    ].join('\n'));
  }
  const child = execa(binary, argv, {
    cwd,
    cancelSignal: ctx.signal,
    stdout: 'pipe',
    stderr: 'pipe',
    reject: false
  });
  await sendProgress(ctx, { progress: 20, total: 100, message: 'scanning' });

  let stdoutBuffer = '';
  let stderrBuffer = '';
  child.stdout?.on('data', (chunk: Buffer | string) => {
    const text = chunk.toString();
    stdoutBuffer += text;
    log.debug('coderabbit stdout chunk', { bytes: chunk.length });
  });
  child.stderr?.on('data', (chunk: Buffer | string) => {
    const text = chunk.toString();
    stderrBuffer += text;
    log.debug('coderabbit stderr chunk', { bytes: chunk.length });
  });

  const heartbeat = setInterval(() => {
    void log.debug('run_review heartbeat', { bytes: stdoutBuffer.length + stderrBuffer.length });
  }, 15_000);

  try {
    const result = await child;
    await sendProgress(ctx, { progress: 35, total: 100, message: 'analyzing' });
    await sendProgress(ctx, { progress: 70, total: 100, message: 'formatting' });
    await sendProgress(ctx, { progress: 100, total: 100, message: 'done' });

    const combined = [stdoutBuffer, stderrBuffer].filter(Boolean).join('\n');
    const durationMs = stopwatch();
    const exitCode = result.exitCode ?? 0;

    const { uri } = storeReport({
      tool: 'run_review',
      title: `run_review exit ${exitCode}`,
      body: combined || result.stdout || result.stderr || '',
      durationMs
    });

    if (exitCode !== 0) {
      const guidance = inferRunFailureGuidance(combined);
      await log.error('coderabbit exited with non-zero status', { exitCode, uri, hasGuidance: Boolean(guidance) });
      const messageParts = [
        `coderabbit exited with code ${exitCode}.`,
        guidance ? `\nSuggested next steps:\n${guidance}` : undefined,
        `\nLog capture: ${uri}`,
        `\n${USER_ESCALATION_NOTE}`
      ].filter(Boolean) as string[];
      const warningText = formatWarnings(warnings);
      if (warningText) {
        messageParts.unshift(warningText);
      }
      throw new Error(messageParts.join('\n'));
    }

    await log.success('coderabbit review completed', { exitCode, uri }, durationMs);

    return {
      content: [
        {
          type: 'text',
          text: formatWarningsBlock(warnings, `CodeRabbit review completed in ${(durationMs / 1000).toFixed(1)}s. See ${uri}`)
        }
      ]
    };
  } finally {
    clearInterval(heartbeat);
  }
}

function inferRunFailureGuidance(output: string): string | null {
  const text = output.toLowerCase();
  if (text.includes('not logged in') || text.includes('login to continue') || text.includes('authentication')) {
    return buildAuthGuide();
  }
  if (text.includes('ensure_cli') || text.includes('install cli') || text.includes('command not found')) {
    return buildInstallGuide();
  }
  return null;
}

function buildAuthGuide(): string {
  return [
    'Authentication appears incomplete. Please perform the following steps manually:',
    '1. Run `coderabbit auth login` in your terminal and open the printed URL in a browser to finish login.',
    '2. Run `coderabbit auth status` and confirm it prints "Logged in as ...".',
    '3. Re-run run_review once the CLI reports a logged-in state.'
  ].join('\n');
}

function collectWarnings(config: RunReviewConfigSection): string[] {
  const warnings: string[] = [];
  if (!config.lock?.configFiles?.length) {
    warnings.push(CONFIG_FILES_WARNING);
  }
  const declaredTimeout = Number(process.env.CODERRABBIT_TOOL_TIMEOUT_SEC ?? '');
  if (!Number.isFinite(declaredTimeout) || declaredTimeout < 600) {
    warnings.push(TOOL_TIMEOUT_WARNING);
  }
  return warnings;
}

function formatWarningsBlock(warnings: string[], message: string): string {
  const prefix = formatWarnings(warnings);
  return prefix ? `${prefix}\n\n${message}` : message;
}

function formatWarnings(warnings: string[]): string | null {
  if (!warnings.length) {
    return null;
  }
  return warnings.map((warning) => `⚠️ ${warning}`).join('\n');
}

function applyConfigDefaults(args: RunReviewArgs, _config: RunReviewConfigSection): RunReviewArgs {
  return args;
}

function applyConfigLocks(args: RunReviewArgs, config: RunReviewConfigSection): { args: RunReviewArgs; overrides: Array<{ key: string; previous: unknown; value: unknown }>; } {
  if (!config.lock) {
    return { args, overrides: [] };
  }
  const next: RunReviewArgs = { ...args };
  const overrides: Array<{ key: string; previous: unknown; value: unknown }> = [];
  for (const [key, value] of Object.entries(config.lock)) {
    if (typeof value === 'undefined') continue;
    const typedKey = key as keyof RunReviewArgs;
    const previous = (next as Record<string, unknown>)[typedKey];
    if (!isEqual(previous, value)) {
      overrides.push({ key, previous, value });
    }
    (next as Record<string, unknown>)[typedKey] = cloneValue(value);
  }
  return { args: next, overrides };
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  return value;
}

function isEqual(a: unknown, b: unknown): boolean {
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false;
    return a.every((item, index) => item === b[index]);
  }
  return a === b;
}
