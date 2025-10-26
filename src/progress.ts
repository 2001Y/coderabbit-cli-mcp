import { randomUUID } from "node:crypto";
import type { ToolExtra } from "./toolContext.js";

const PHASES = {
  boot: { progress: 5, message: "boot" },
  scanning: { progress: 30, message: "scanning" },
  analyzing: { progress: 60, message: "analyzing" },
  formatting: { progress: 85, message: "formatting" },
  done: { progress: 100, message: "done" },
} as const;

export type ProgressPhase = keyof typeof PHASES;

export async function reportPhase(extra: ToolExtra, phase: ProgressPhase, overrideMessage?: string) {
  const details = PHASES[phase];
  if (!details) return;

  const token = (extra._meta as { progressToken?: string | number } | undefined)?.progressToken ?? extra.requestId ?? randomUUID();

  const notification = {
    jsonrpc: "2.0",
    method: "notifications/progress",
    params: {
      progressToken: token,
      progress: details.progress,
      total: 100,
      message: overrideMessage ?? details.message,
    },
  };

  try {
    await extra.sendNotification(notification);
  } catch {
    // progress failure should not break the tool invocation
  }
}
