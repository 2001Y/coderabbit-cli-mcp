import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import type { ToolContext } from '../types.js';
export declare const EnsureCliArgsSchema: z.ZodObject<{
    dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    force: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type EnsureCliArgs = z.infer<typeof EnsureCliArgsSchema>;
export declare function ensureCli(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult>;
