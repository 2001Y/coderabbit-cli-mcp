import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import type { ToolContext } from '../types.js';
import { runCoderabbitSubcommand } from '../lib/coderabbit.js';
import { createLogger, createStopwatch } from '../logger.js';
import { storeReport } from '../resources/outputsStore.js';

const log = createLogger('tools.auth_login');

export const AuthLoginArgsSchema = z.object({
  extraArgs: z.array(z.string()).optional()
});

export async function authLogin(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult> {
  const args = AuthLoginArgsSchema.parse(rawArgs ?? {});
  const stopwatch = createStopwatch();
  const argv = ['auth', 'login', ...(args.extraArgs ?? [])];
  await log.info('starting coderabbit auth login', { argv });

  const result = await runCoderabbitSubcommand(argv, {
    signal: ctx.signal,
    timeoutMs: 5 * 60 * 1000
  });

  const combined = result.all ?? `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
  const durationMs = stopwatch();
  const { uri } = storeReport({
    tool: 'auth_login',
    title: 'auth_login output',
    body: combined,
    durationMs
  });

  if ((result.exitCode ?? 0) !== 0) {
    await log.error('auth login failed', { exitCode: result.exitCode, uri });
    throw new Error(`coderabbit auth login failed with code ${result.exitCode}. See ${uri}`);
  }

  const match = combined.match(/https?:\/\/\S+/);
  const url = match ? match[0].replace(/[)\]]+$/, '') : undefined;
  await log.success('auth login completed', { uri, hasUrl: Boolean(url) }, durationMs);

  return {
    content: [
      {
        type: 'text',
        text: url
          ? `Open the following URL to finish authentication:\n${url}\nOutput saved: ${uri}`
          : `Authentication output stored at ${uri}. Follow the CLI instructions shown.`
      }
    ]
  };
}
