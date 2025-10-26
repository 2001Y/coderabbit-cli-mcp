import { resolve } from 'node:path';
import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import { createLogger } from '../logger.js';
import { coderabbitVersion, resolveCoderabbitBinary } from '../lib/coderabbit.js';
import { isGitAvailable, isInsideRepo, hasPendingChanges, currentBranch } from '../lib/git.js';

const log = createLogger('tools.doctor');

export const DoctorArgsSchema = z.object({
  cwd: z.string().optional()
});

export type DoctorArgs = z.infer<typeof DoctorArgsSchema>;

export async function doctor(rawArgs: DoctorArgs | undefined): Promise<CallToolResult> {
  const args = DoctorArgsSchema.parse(rawArgs ?? {});
  const cwd = args.cwd ? resolve(args.cwd) : process.cwd();
  const findings: string[] = [];

  const git = await isGitAvailable();
  findings.push(git ? 'git: available' : 'git: NOT found');

  if (git) {
    const inside = await isInsideRepo(cwd);
    findings.push(inside ? `repo: ${cwd}` : `repo: not a git repo (${cwd})`);
    if (inside) {
      const branch = await currentBranch(cwd);
      const dirty = await hasPendingChanges(cwd);
      findings.push(`branch: ${branch ?? 'unknown'}`);
      findings.push(dirty ? 'changes: pending' : 'changes: clean');
    }
  }

  try {
    const binary = await resolveCoderabbitBinary();
    const version = await coderabbitVersion();
    findings.push(`coderabbit: ${version} @ ${binary}`);
  } catch (error) {
    findings.push(`coderabbit: missing (${(error as Error).message})`);
  }

  await log.info('doctor inspection complete', { cwd, findings });

  return {
    content: [
      {
        type: 'text',
        text: findings.join('\n')
      }
    ]
  };
}
