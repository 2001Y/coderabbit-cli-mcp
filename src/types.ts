import { z } from "zod";

export const ModeSchema = z.enum(["interactive", "plain", "prompt-only"]);
export const ReviewScopeSchema = z.enum(["all", "committed", "uncommitted"]);

export const RunReviewInputSchema = z
  .object({
    mode: ModeSchema.default("plain"),
    type: ReviewScopeSchema.default("all"),
    base: z.string().trim().min(1).optional(),
    baseCommit: z.string().trim().min(1).optional(),
    cwd: z.string().trim().min(1).optional(),
    configFiles: z.array(z.string().trim().min(1)).optional(),
    noColor: z.boolean().optional(),
    timeoutSec: z.number().int().min(1).max(4 * 60 * 60).optional(),
    extraArgs: z.array(z.string().trim().min(1)).optional(),
  })
  .strict();

export type RunReviewInput = z.infer<typeof RunReviewInputSchema>;

export const EnsureCliInputSchema = z
  .object({
    dryRun: z.boolean().optional(),
    force: z.boolean().optional(),
  })
  .strict();
export type EnsureCliInput = z.infer<typeof EnsureCliInputSchema>;

export const InstallCliInputSchema = EnsureCliInputSchema;
export type InstallCliInput = EnsureCliInput;

export const AuthLoginSchema = z.object({}).strict();
export const AuthStatusSchema = z.object({}).strict();
export const VersionSchema = z.object({}).strict();
export const CliHelpSchema = z.object({}).strict();

export const WriteConfigSchema = z
  .object({
    targetPath: z.string().trim().min(1).default(".coderabbit.yaml"),
    force: z.boolean().optional(),
  })
  .strict();
export type WriteConfigInput = z.infer<typeof WriteConfigSchema>;

export const DoctorSchema = z
  .object({
    cwd: z.string().trim().min(1).optional(),
  })
  .strict();
export type DoctorInput = z.infer<typeof DoctorSchema>;

export type StructuredToolContent = {
  type: "text";
  text: string;
};

export interface CommandRunOptions {
  cwd?: string;
  timeoutMs?: number;
  env?: Record<string, string>;
  signal?: AbortSignal;
  allowFail?: boolean;
}

export interface CommandRunResult {
  stdout: string;
  stderr: string;
  combined?: string;
  exitCode: number;
  failed: boolean;
  durationMs: number;
}

export const DEFAULT_TIMEOUT_SEC = 60 * 60;
