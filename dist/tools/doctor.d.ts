import { z } from 'zod';
import type { CallToolResult } from '@modelcontextprotocol/sdk/dist/esm/types';
export declare const DoctorArgsSchema: z.ZodObject<{
    cwd: z.ZodOptional<z.ZodString>;
}, z.core.$strip>;
export type DoctorArgs = z.infer<typeof DoctorArgsSchema>;
export declare function doctor(rawArgs: DoctorArgs | undefined): Promise<CallToolResult>;
