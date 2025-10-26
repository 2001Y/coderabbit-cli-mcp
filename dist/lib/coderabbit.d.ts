export declare function resolveCoderabbitBinary(forceRefresh?: boolean): Promise<string>;
export declare function coderabbitVersion(forceRefresh?: boolean): Promise<string>;
export declare function clearCachedBinary(): void;
export declare function runCoderabbitSubcommand(args: string[], options?: {
    cwd?: string;
    timeoutMs?: number;
    cancelSignal?: AbortSignal;
    env?: Record<string, string>;
}): Promise<import("execa").Result<{
    cwd: string | undefined;
    timeout: number | undefined;
    cancelSignal: AbortSignal | undefined;
    all: true;
    reject: false;
    env: Record<string, string> | undefined;
}>>;
