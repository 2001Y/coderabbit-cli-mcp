import type { ToolContext } from './types.js';
export interface ProgressPhase {
    progress: number;
    message: string;
    total?: number;
}
export declare function sendProgress(ctx: ToolContext, phase: ProgressPhase): Promise<void>;
