import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import type { ToolContext } from '../types.js';
export declare const RunReviewArgsSchema: z.ZodObject<{
    mode: z.ZodDefault<z.ZodEnum<{
        plain: "plain";
        "prompt-only": "prompt-only";
        interactive: "interactive";
    }>>;
    type: z.ZodOptional<z.ZodDefault<z.ZodEnum<{
        uncommitted: "uncommitted";
        all: "all";
        committed: "committed";
    }>>>;
    base: z.ZodOptional<z.ZodString>;
    baseCommit: z.ZodOptional<z.ZodString>;
    cwd: z.ZodOptional<z.ZodString>;
    configFiles: z.ZodOptional<z.ZodArray<z.ZodString>>;
    noColor: z.ZodOptional<z.ZodBoolean>;
    timeoutSec: z.ZodOptional<z.ZodNumber>;
    extraArgs: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export type RunReviewArgs = z.infer<typeof RunReviewArgsSchema>;
export declare function runReview(args: RunReviewArgs, ctx: ToolContext): Promise<CallToolResult>;
