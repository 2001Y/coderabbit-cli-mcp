import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import { coderabbitVersion, resolveCoderabbitBinary } from '../lib/coderabbit.js';
import { createLogger } from '../logger.js';

const log = createLogger('tools.version');

export async function version(): Promise<CallToolResult> {
  const binary = await resolveCoderabbitBinary();
  const versionValue = await coderabbitVersion();
  await log.success('version retrieved', { binary, version: versionValue });
  return {
    content: [
      {
        type: 'text',
        text: `coderabbit version ${versionValue} (${binary})`
      }
    ]
  };
}
