import pc from 'picocolors';

export type LogLevel = 'INFO' | 'DEBUG' | 'SUCCESS' | 'WARNING' | 'ERROR';

export type LogMeta = Record<string, unknown>;

export interface LogEntry {
  ts: string;
  level: LogLevel;
  scope: string;
  message: string;
  durationMs?: number;
  meta?: LogMeta;
}

type LogTransmitter = (entry: LogEntry) => void | Promise<void>;

const transmitters = new Set<LogTransmitter>();

export function registerLogTransmitter(transmitter: LogTransmitter): () => void {
  transmitters.add(transmitter);
  return () => transmitters.delete(transmitter);
}

const levelColor: Record<LogLevel, (input: string) => string> = {
  INFO: pc.cyan,
  DEBUG: pc.gray,
  SUCCESS: pc.green,
  WARNING: pc.yellow,
  ERROR: pc.red
};

transmitters.add((entry) => {
  const color = levelColor[entry.level];
  const prefix = `${entry.ts} ${entry.level.padEnd(7)} ${entry.scope}`;
  const meta = entry.meta && Object.keys(entry.meta).length ? ` ${JSON.stringify(entry.meta)}` : '';
  const duration = typeof entry.durationMs === 'number' ? ` (${entry.durationMs.toFixed(1)}ms)` : '';
  console.error(color(`${prefix}: ${entry.message}${duration}${meta}`));
});

async function emit(entry: LogEntry) {
  await Promise.allSettled(Array.from(transmitters).map(async (tx) => tx(entry)));
}

export class Logger {
  constructor(private readonly scope: string) {}

  child(suffix: string): Logger {
    return new Logger(`${this.scope}.${suffix}`);
  }

  async log(level: LogLevel, message: string, meta?: LogMeta, durationMs?: number) {
    const entry: LogEntry = {
      ts: new Date().toISOString(),
      level,
      scope: this.scope,
      message,
      durationMs,
      ...(meta ? { meta } : {})
    };
    await emit(entry);
  }

  info(message: string, meta?: LogMeta) {
    return this.log('INFO', message, meta);
  }

  debug(message: string, meta?: LogMeta) {
    return this.log('DEBUG', message, meta);
  }

  success(message: string, meta?: LogMeta, durationMs?: number) {
    return this.log('SUCCESS', message, meta, durationMs);
  }

  warn(message: string, meta?: LogMeta) {
    return this.log('WARNING', message, meta);
  }

  error(message: string, meta?: LogMeta) {
    return this.log('ERROR', message, meta);
  }
}

export function createLogger(scope: string): Logger {
  return new Logger(scope);
}

export function createStopwatch(): () => number {
  const start = process.hrtime.bigint();
  return () => Number(process.hrtime.bigint() - start) / 1_000_000;
}
