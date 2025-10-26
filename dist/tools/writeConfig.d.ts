import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
export declare const WriteConfigArgsSchema: z.ZodObject<{
    path: z.ZodDefault<z.ZodOptional<z.ZodString>>;
    overwrite: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export declare function writeConfig(rawArgs: unknown): Promise<CallToolResult>;
