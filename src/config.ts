import { readFileSync, existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse } from 'toml';
import { createLogger } from './logger.js';

const log = createLogger('config');

type ConfigurableKeys = {
  mode?: string;
  type?: string;
  configFiles?: string[];
};

export interface RunReviewConfigSection {
  lock?: Partial<ConfigurableKeys>;
}

interface AppConfig {
  run_review?: RunReviewConfigSection;
}

let cachedPath: string | undefined;
let cachedConfig: RunReviewConfigSection | null = null;
let loaded = false;

const DEFAULT_CONFIG_FILENAMES = ['coderabbit-mcp.config.toml'];

export function getRunReviewConfig(): RunReviewConfigSection {
  if (loaded) {
    return cachedConfig ?? {};
  }
  loaded = true;
  const sections: RunReviewConfigSection[] = [];
  const envSection = loadConfigFromEnv();
  if (envSection) sections.push(envSection);
  const fileSection = loadConfigFromFile();
  if (fileSection) sections.push(fileSection);

  cachedConfig = sections.reduce<RunReviewConfigSection>((acc, section) => mergeSections(acc, section), {});
  return cachedConfig ?? {};
}

function loadConfigFromFile(): RunReviewConfigSection | undefined {
  const path = resolveConfigPath();
  if (!path) {
    return undefined;
  }
  try {
    const raw = readFileSync(path, 'utf8');
    const parsed = parse(raw) as AppConfig;
    const sanitized = sanitizeRunReviewConfig(parsed.run_review ?? {});
    if (sanitized.lock) {
      void log.info('loaded config file', { path });
      return sanitized;
    }
  } catch (error) {
    void log.warn('failed to load config file', { path, error: (error as Error).message });
  }
  return undefined;
}

function loadConfigFromEnv(): RunReviewConfigSection | undefined {
  const lock: Partial<ConfigurableKeys> = {};
  const mode = process.env.CODERRABBIT_MCP_LOCK_MODE?.trim();
  if (mode) lock.mode = mode;
  const type = process.env.CODERRABBIT_MCP_LOCK_TYPE?.trim();
  if (type) lock.type = type;
  const cfgRaw = process.env.CODERRABBIT_MCP_LOCK_CONFIG_FILES;
  if (cfgRaw) {
    try {
      const parsed = JSON.parse(cfgRaw);
      if (!Array.isArray(parsed)) {
        throw new Error('value must be a JSON array');
      }
      lock.configFiles = parsed.map((entry) => String(entry));
    } catch (error) {
      void log.warn('failed to parse CODERRABBIT_MCP_LOCK_CONFIG_FILES', { error: (error as Error).message });
    }
  }
  const section = sanitizeRunReviewConfig({ lock });
  if (section.lock) {
    void log.info('loaded config from env', { lock: true });
    return section;
  }
  return undefined;
}

function resolveConfigPath(): string | undefined {
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

function sanitizeRunReviewConfig(section: RunReviewConfigSection): RunReviewConfigSection {
  return {
    lock: sanitizeConfigBlock(section.lock)
  };
}

function sanitizeConfigBlock(block?: Partial<ConfigurableKeys>): Partial<ConfigurableKeys> | undefined {
  if (!block) return undefined;
  const normalized: Partial<ConfigurableKeys> = {};
  if (typeof block.mode === 'string') normalized.mode = block.mode;
  if (typeof block.type === 'string') normalized.type = block.type;
  if (block.configFiles) normalized.configFiles = toStringArray(block.configFiles);
  return Object.keys(normalized).length ? normalized : undefined;
}

function toStringArray(value: unknown): string[] | undefined {
  if (!Array.isArray(value)) return undefined;
  return value.map((item) => String(item));
}

function mergeSections(base: RunReviewConfigSection, incoming?: RunReviewConfigSection): RunReviewConfigSection {
  if (!incoming) {
    return base;
  }
  return {
    lock: mergeBlocks(base.lock, incoming.lock)
  };
}

function mergeBlocks(base?: Partial<ConfigurableKeys>, incoming?: Partial<ConfigurableKeys>): Partial<ConfigurableKeys> | undefined {
  if (!incoming) {
    return base;
  }
  const result: Partial<ConfigurableKeys> = { ...(base ?? {}) };
  for (const [key, value] of Object.entries(incoming)) {
    if (typeof value === 'undefined') continue;
    (result as Record<string, unknown>)[key] = cloneValue(value);
  }
  return Object.keys(result).length ? result : undefined;
}

function cloneValue<T>(value: T): T {
  if (Array.isArray(value)) {
    return [...value] as T;
  }
  return value;
}
