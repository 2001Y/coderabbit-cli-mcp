import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import type { ToolContext } from '../types.js';
export declare const AuthLoginArgsSchema: z.ZodObject<{
    extraArgs: z.ZodOptional<z.ZodArray<z.ZodString>>;
}, z.core.$strip>;
export declare function authLogin(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult>;
