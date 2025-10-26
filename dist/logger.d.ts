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
export declare function registerLogTransmitter(transmitter: LogTransmitter): () => void;
export declare class Logger {
    private readonly scope;
    constructor(scope: string);
    child(suffix: string): Logger;
    log(level: LogLevel, message: string, meta?: LogMeta, durationMs?: number): Promise<void>;
    info(message: string, meta?: LogMeta): Promise<void>;
    debug(message: string, meta?: LogMeta): Promise<void>;
    success(message: string, meta?: LogMeta, durationMs?: number): Promise<void>;
    warn(message: string, meta?: LogMeta): Promise<void>;
    error(message: string, meta?: LogMeta): Promise<void>;
}
export declare function createLogger(scope: string): Logger;
export declare function createStopwatch(): () => number;
export {};
