import { existsSync, statSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { execa } from 'execa';
import { resolveCoderabbitBinary } from '../lib/coderabbit.js';
import { createLogger, createStopwatch } from '../logger.js';
import { sendProgress } from '../progress.js';
import { storeReport } from '../resources/outputsStore.js';
const log = createLogger('tools.run_review');
export const RunReviewArgsSchema = z.object({
    mode: z.enum(['interactive', 'plain', 'prompt-only']).default('plain'),
    type: z.enum(['all', 'committed', 'uncommitted']).default('all').optional(),
    base: z.string().optional(),
    baseCommit: z.string().optional(),
    cwd: z.string().optional(),
    configFiles: z.array(z.string()).optional(),
    noColor: z.boolean().optional(),
    timeoutSec: z.number().int().positive().max(4 * 3600).optional(),
    extraArgs: z.array(z.string()).optional()
});
function buildArgv(parsed) {
    const args = [];
    const mode = parsed.mode ?? 'plain';
    if (mode === 'plain')
        args.push('--plain');
    if (mode === 'prompt-only')
        args.push('--prompt-only');
    const reviewType = parsed.type ?? 'all';
    args.push('--type', reviewType);
    if (parsed.base)
        args.push('--base', parsed.base);
    if (parsed.baseCommit)
        args.push('--base-commit', parsed.baseCommit);
    if (parsed.noColor)
        args.push('--no-color');
    if (parsed.cwd)
        args.push('--cwd', resolve(parsed.cwd));
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
export async function runReview(args, ctx) {
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
    const binary = await resolveCoderabbitBinary();
    const child = execa(binary, argv, {
        cwd,
        timeout: (args.timeoutSec ?? 3600) * 1000,
        signal: ctx.signal,
        stdout: 'pipe',
        stderr: 'pipe',
        reject: false
    });
    await sendProgress(ctx, { progress: 20, total: 100, message: 'scanning' });
    let stdoutBuffer = '';
    let stderrBuffer = '';
    child.stdout?.on('data', (chunk) => {
        const text = chunk.toString();
        stdoutBuffer += text;
        log.debug('coderabbit stdout chunk', { bytes: chunk.length });
    });
    child.stderr?.on('data', (chunk) => {
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
            await log.error('coderabbit exited with non-zero status', { exitCode, uri });
            throw new Error(`coderabbit exited with code ${exitCode}. Output stored at ${uri}`);
        }
        await log.success('coderabbit review completed', { exitCode, uri }, durationMs);
        return {
            content: [
                {
                    type: 'text',
                    text: `CodeRabbit review completed in ${(durationMs / 1000).toFixed(1)}s. See ${uri}`
                }
            ]
        };
    }
    finally {
        clearInterval(heartbeat);
    }
}
//# sourceMappingURL=runReview.js.map