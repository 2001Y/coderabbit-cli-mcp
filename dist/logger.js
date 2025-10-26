import pc from 'picocolors';
const transmitters = new Set();
export function registerLogTransmitter(transmitter) {
    transmitters.add(transmitter);
    return () => transmitters.delete(transmitter);
}
const levelColor = {
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
async function emit(entry) {
    await Promise.allSettled(Array.from(transmitters).map(async (tx) => tx(entry)));
}
export class Logger {
    scope;
    constructor(scope) {
        this.scope = scope;
    }
    child(suffix) {
        return new Logger(`${this.scope}.${suffix}`);
    }
    async log(level, message, meta, durationMs) {
        const entry = {
            ts: new Date().toISOString(),
            level,
            scope: this.scope,
            message,
            durationMs,
            ...(meta ? { meta } : {})
        };
        await emit(entry);
    }
    info(message, meta) {
        return this.log('INFO', message, meta);
    }
    debug(message, meta) {
        return this.log('DEBUG', message, meta);
    }
    success(message, meta, durationMs) {
        return this.log('SUCCESS', message, meta, durationMs);
    }
    warn(message, meta) {
        return this.log('WARNING', message, meta);
    }
    error(message, meta) {
        return this.log('ERROR', message, meta);
    }
}
export function createLogger(scope) {
    return new Logger(scope);
}
export function createStopwatch() {
    const start = process.hrtime.bigint();
    return () => Number(process.hrtime.bigint() - start) / 1_000_000;
}
//# sourceMappingURL=logger.js.map