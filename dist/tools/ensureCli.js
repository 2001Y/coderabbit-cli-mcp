import { z } from 'zod';
import { createLogger } from '../logger.js';
import { coderabbitVersion, resolveCoderabbitBinary, clearCachedBinary } from '../lib/coderabbit.js';
import { performInstall } from './installCli.js';
const log = createLogger('tools.ensure_cli');
export const EnsureCliArgsSchema = z.object({
    dryRun: z.boolean().optional().default(false),
    force: z.boolean().optional().default(false)
});
export async function ensureCli(rawArgs, ctx) {
    const args = EnsureCliArgsSchema.parse(rawArgs ?? {});
    if (!args.force) {
        try {
            const binary = await resolveCoderabbitBinary();
            const version = await coderabbitVersion();
            await log.success('coderabbit already installed', { binary, version });
            return {
                content: [
                    { type: 'text', text: `CodeRabbit CLI already installed (${version}) at ${binary}` }
                ]
            };
        }
        catch (error) {
            await log.warn('coderabbit not detected', { reason: error.message });
        }
    }
    if (args.dryRun) {
        const summary = await performInstall({ dryRun: true, confirm: false }, ctx);
        return { content: [{ type: 'text', text: summary.summary }] };
    }
    const summary = await performInstall({ dryRun: false, confirm: true }, ctx);
    clearCachedBinary();
    const version = await coderabbitVersion(true);
    return {
        content: [
            { type: 'text', text: `${summary.summary}\nDetected version: ${version}` }
        ]
    };
}
//# sourceMappingURL=ensureCli.js.map