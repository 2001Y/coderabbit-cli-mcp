import type { ToolContext } from './types.js';
import { createLogger } from './logger.js';

const log = createLogger('progress');

export interface ProgressPhase {
  progress: number;
  message: string;
  total?: number;
}

export async function sendProgress(ctx: ToolContext, phase: ProgressPhase): Promise<void> {
  const token = ctx._meta?.progressToken;
  if (!token) {
    return;
  }

  try {
    await ctx.sendNotification({
      method: 'notifications/progress',
      params: {
        progressToken: token,
        progress: phase.progress,
        ...(typeof phase.total === 'number' ? { total: phase.total } : {}),
        ...(phase.message ? { message: phase.message } : {})
      }
    } as never);
  } catch (error) {
    await log.warn('failed to send progress notification', { error: (error as Error).message });
  }
}
