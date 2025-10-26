import os from 'node:os';
import { execa } from 'execa';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import { createLogger, createStopwatch } from '../logger.js';
import { storeReport } from '../resources/outputsStore.js';
import { clearCachedBinary } from '../lib/coderabbit.js';
import type { ToolContext } from '../types.js';
import { sendProgress } from '../progress.js';

const log = createLogger('tools.install_cli');

export const InstallCliArgsSchema = z.object({
  dryRun: z.boolean().optional().default(false),
  confirm: z.boolean().optional().default(false)
});

export type InstallCliArgs = z.infer<typeof InstallCliArgsSchema>;

export async function installCli(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult> {
  const args = InstallCliArgsSchema.parse(rawArgs ?? {});
  const result = await performInstall(args, ctx);
  return {
    content: [
      {
        type: 'text',
        text: result.summary
      }
    ]
  };
}

export async function performInstall(args: InstallCliArgs, ctx?: ToolContext): Promise<{ summary: string }> {
  const platform = os.platform();
  const stopwatch = createStopwatch();

  if (platform === 'win32') {
    const summary = 'Windows では公式に WSL2 上でのインストールが推奨されています。WSL 内で curl -fsSL https://cli.coderabbit.ai/install.sh | sh を実行してください。';
    await log.warn('windows install not available, suggest WSL2');
    return { summary };
  }

  if (!['darwin', 'linux'].includes(platform)) {
    throw new Error(`Unsupported platform ${platform}. Only macOS or Linux are supported.`);
  }

  const installCmd = 'curl -fsSL https://cli.coderabbit.ai/install.sh | sh';
  await log.info('install command prepared', { installCmd, dryRun: args.dryRun });
  if (ctx) {
    await sendProgress(ctx, { progress: 10, total: 100, message: 'preparing installer' });
  }

  if (args.dryRun) {
    return { summary: `Dry-run: installer command would be:\n${installCmd}` };
  }

  if (!args.confirm) {
    throw new Error('Set confirm=true to execute install_cli. The command downloads and runs the official installer.');
  }

  const child = execa('sh', ['-c', installCmd], {
    stdout: 'pipe',
    stderr: 'pipe',
    timeout: 5 * 60 * 1000,
    signal: ctx?.signal
  });

  let combined = '';
  child.stdout?.on('data', (chunk: Buffer | string) => {
    combined += chunk.toString();
  });
  child.stderr?.on('data', (chunk: Buffer | string) => {
    combined += chunk.toString();
  });

  const result = await child;
  const exitCode = result.exitCode ?? 0;
  const durationMs = stopwatch();

  const { uri } = storeReport({
    tool: 'install_cli',
    title: `install_cli exit ${exitCode}`,
    body: combined,
    durationMs
  });

  if (exitCode !== 0) {
    await log.error('installer failed', { exitCode, uri });
    throw new Error(`installer failed with code ${exitCode}. See ${uri}`);
  }

  clearCachedBinary();
  await log.success('installer completed', { uri }, durationMs);
  if (ctx) {
    await sendProgress(ctx, { progress: 100, total: 100, message: 'install completed' });
  }

  return { summary: `CodeRabbit CLI installed successfully. Logs stored at ${uri}.` };
}
