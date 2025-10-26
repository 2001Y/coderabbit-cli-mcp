import { createLogger } from './logger.js';
const log = createLogger('progress');
export async function sendProgress(ctx, phase) {
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
        });
    }
    catch (error) {
        await log.warn('failed to send progress notification', { error: error.message });
    }
}
//# sourceMappingURL=progress.js.map