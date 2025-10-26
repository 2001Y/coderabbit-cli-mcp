import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import type { ToolContext } from '../types.js';
export declare const RunReviewArgsSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<["interactive", "plain", "prompt-only"]>>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<["all", "committed", "uncommitted"]>>>;
    base: z.ZodOptional<z.ZodString>;
    baseCommit: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    configFiles: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
    noColor: z.ZodOptional<z.ZodBoolean>;
    timeoutSec: z.ZodOptional<z.ZodNumber>;
    extraArgs: z.ZodOptional<z.ZodArray<z.ZodString, "many">>;
}, "strip", z.ZodTypeAny, {
    mode: "plain" | "prompt-only" | "interactive";
    type?: "uncommitted" | "all" | "committed" | undefined;
    cwd?: string | undefined;
    base?: string | undefined;
    baseCommit?: string | undefined;
    configFiles?: string[] | undefined;
    noColor?: boolean | undefined;
    timeoutSec?: number | undefined;
    extraArgs?: string[] | undefined;
}, {
    type?: "uncommitted" | "all" | "committed" | undefined;
    cwd?: string | undefined;
    mode?: "plain" | "prompt-only" | "interactive" | undefined;
    base?: string | undefined;
    baseCommit?: string | undefined;
    configFiles?: string[] | undefined;
    noColor?: boolean | undefined;
    timeoutSec?: number | undefined;
    extraArgs?: string[] | undefined;
}>;
export type RunReviewArgs = z.infer<typeof RunReviewArgsSchema>;
export declare function runReview(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult>;
