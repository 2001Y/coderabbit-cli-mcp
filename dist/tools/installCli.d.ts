import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
import type { ToolContext } from '../types.js';
export declare const InstallCliArgsSchema: z.ZodObject<{
    dryRun: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
    confirm: z.ZodDefault<z.ZodOptional<z.ZodBoolean>>;
}, z.core.$strip>;
export type InstallCliArgs = z.infer<typeof InstallCliArgsSchema>;
export declare function installCli(rawArgs: unknown, ctx: ToolContext): Promise<CallToolResult>;
export declare function performInstall(args: InstallCliArgs, ctx?: ToolContext): Promise<{
    summary: string;
}>;
