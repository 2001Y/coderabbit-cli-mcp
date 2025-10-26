import { access } from 'node:fs/promises';
import { constants } from 'node:fs';
import { delimiter, join } from 'node:path';
import os from 'node:os';
import { execa } from 'execa';
import { createLogger } from '../logger.js';
const log = createLogger('lib.coderabbit');
let cachedBinary = null;
let cachedVersion = null;
const EXECUTABLE = os.platform() === 'win32' ? ['coderabbit.exe', 'coderabbit.cmd', 'coderabbit.bat'] : ['coderabbit'];
async function isExecutable(path) {
    try {
        await access(path, constants.X_OK);
        return true;
    }
    catch {
        return false;
    }
}
function unique(items) {
    return Array.from(new Set(items));
}
function resolveSearchPaths() {
    const envPath = process.env.PATH ?? '';
    return envPath.split(delimiter).filter(Boolean);
}
export async function resolveCoderabbitBinary(forceRefresh = false) {
    if (!forceRefresh && cachedBinary) {
        return cachedBinary;
    }
    const explicit = process.env.CODERABBIT_CLI_PATH;
    if (explicit && (await isExecutable(explicit))) {
        cachedBinary = explicit;
        return explicit;
    }
    for (const entry of unique(resolveSearchPaths())) {
        for (const candidate of EXECUTABLE) {
            const full = join(entry, candidate);
            if (await isExecutable(full)) {
                cachedBinary = full;
                return full;
            }
        }
    }
    throw new Error('coderabbit CLI not found on PATH. Run ensure_cli to install or set CODERABBIT_CLI_PATH.');
}
export async function coderabbitVersion(forceRefresh = false) {
    if (!forceRefresh && cachedVersion) {
        return cachedVersion;
    }
    const binary = await resolveCoderabbitBinary(forceRefresh);
    const { stdout } = await execa(binary, ['--version']);
    const version = stdout.trim();
    cachedVersion = version;
    await log.info('detected coderabbit version', { version });
    return version;
}
export function clearCachedBinary() {
    cachedBinary = null;
    cachedVersion = null;
}
export async function runCoderabbitSubcommand(args, options = {}) {
    const binary = await resolveCoderabbitBinary();
    return execa(binary, args, {
        cwd: options.cwd,
        timeout: options.timeoutMs,
        signal: options.signal,
        all: true,
        reject: false,
        env: options.env
    });
}
//# sourceMappingURL=coderabbit.js.map