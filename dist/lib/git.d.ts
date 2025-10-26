export declare function isGitAvailable(): Promise<boolean>;
export declare function isInsideRepo(cwd?: string): Promise<boolean>;
export declare function hasPendingChanges(cwd?: string): Promise<boolean>;
export declare function currentBranch(cwd?: string): Promise<string | null>;
