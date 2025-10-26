import { existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { z } from 'zod';
import { createLogger } from '../logger.js';
import { buildCoderabbitConfigTemplate } from '../lib/template.js';
const log = createLogger('tools.write_config');
export const WriteConfigArgsSchema = z.object({
    path: z.string().optional().default('./.coderabbit.yaml'),
    overwrite: z.boolean().optional().default(false)
});
export async function writeConfig(rawArgs) {
    const args = WriteConfigArgsSchema.parse(rawArgs ?? {});
    const target = resolve(args.path);
    if (!args.overwrite && existsSync(target)) {
        throw new Error(`config already exists at ${target}. Pass overwrite=true to replace.`);
    }
    writeFileSync(target, buildCoderabbitConfigTemplate(), 'utf8');
    await log.success('wrote config template', { target, overwrite: args.overwrite });
    return {
        content: [
            {
                type: 'text',
                text: `Created CodeRabbit config template at ${target}`
            }
        ]
    };
}
//# sourceMappingURL=writeConfig.js.map