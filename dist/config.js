import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'toml';
import { createLogger } from './logger.js';
const log = createLogger('config');
let cachedPath;
let cachedConfig = null;
let loaded = false;
const DEFAULT_CONFIG_FILENAMES = ['coderabbit-mcp.config.toml'];
export function getRunReviewConfig() {
    if (loaded) {
        return cachedConfig ?? {};
    }
    loaded = true;
    const sections = [];
    const envSection = loadConfigFromEnv();
    if (envSection)
        sections.push(envSection);
    const fileSection = loadConfigFromFile();
    if (fileSection)
        sections.push(fileSection);
    cachedConfig = sections.reduce((acc, section) => mergeSections(acc, section), {});
    return cachedConfig ?? {};
}
function loadConfigFromFile() {
    const path = resolveConfigPath();
    if (!path) {
        return undefined;
    }
    try {
        const raw = readFileSync(path, 'utf8');
        const parsed = parse(raw);
        const sanitized = sanitizeRunReviewConfig(parsed.run_review ?? {});
        if (sanitized.lock) {
            void log.info('loaded config file', { path });
            return sanitized;
        }
    }
    catch (error) {
        void log.warn('failed to load config file', { path, error: error.message });
    }
    return undefined;
}
function loadConfigFromEnv() {
    const lock = {};
    const mode = process.env.CODERRABBIT_MCP_LOCK_MODE?.trim();
    if (mode)
        lock.mode = mode;
    const type = process.env.CODERRABBIT_MCP_LOCK_TYPE?.trim();
    if (type)
        lock.type = type;
    const cfgRaw = process.env.CODERRABBIT_MCP_LOCK_CONFIG_FILES;
    if (cfgRaw) {
        try {
            const parsed = JSON.parse(cfgRaw);
            if (!Array.isArray(parsed)) {
                throw new Error('value must be a JSON array');
            }
            lock.configFiles = parsed.map((entry) => String(entry));
        }
        catch (error) {
            void log.warn('failed to parse CODERRABBIT_MCP_LOCK_CONFIG_FILES', { error: error.message });
        }
    }
    const section = sanitizeRunReviewConfig({ lock });
    if (section.lock) {
        void log.info('loaded config from env', { lock: true });
        return section;
    }
    return undefined;
}
function resolveConfigPath() {
    if (cachedPath) {
        return cachedPath;
    }
    const envPath = process.env.CODERRABBIT_MCP_CONFIG;
    if (envPath && existsSync(envPath)) {
        cachedPath = resolve(envPath);
        return cachedPath;
    }
    for (const filename of DEFAULT_CONFIG_FILENAMES) {
        const candidate = resolve(process.cwd(), filename);
        if (existsSync(candidate)) {
            cachedPath = candidate;
            return cachedPath;
        }
    }
    return undefined;
}
function sanitizeRunReviewConfig(section) {
    return {
        lock: sanitizeConfigBlock(section.lock)
    };
}
function sanitizeConfigBlock(block) {
    if (!block)
        return undefined;
    const normalized = {};
    if (typeof block.mode === 'string')
        normalized.mode = block.mode;
    if (typeof block.type === 'string')
        normalized.type = block.type;
    if (block.configFiles)
        normalized.configFiles = toStringArray(block.configFiles);
    return Object.keys(normalized).length ? normalized : undefined;
}
function toStringArray(value) {
    if (!Array.isArray(value))
        return undefined;
    return value.map((item) => String(item));
}
function mergeSections(base, incoming) {
    if (!incoming) {
        return base;
    }
    return {
        lock: mergeBlocks(base.lock, incoming.lock)
    };
}
function mergeBlocks(base, incoming) {
    if (!incoming) {
        return base;
    }
    const result = { ...(base ?? {}) };
    for (const [key, value] of Object.entries(incoming)) {
        if (typeof value === 'undefined')
            continue;
        result[key] = cloneValue(value);
    }
    return Object.keys(result).length ? result : undefined;
}
function cloneValue(value) {
    if (Array.isArray(value)) {
        return [...value];
    }
    return value;
}
//# sourceMappingURL=config.js.map