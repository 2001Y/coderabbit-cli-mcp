import { runCoderabbitSubcommand } from '../lib/coderabbit.js';
import { createLogger, createStopwatch } from '../logger.js';
import { storeReport } from '../resources/outputsStore.js';
const log = createLogger('tools.auth_status');
export async function authStatus(ctx) {
    const stopwatch = createStopwatch();
    const result = await runCoderabbitSubcommand(['auth', 'status'], {
        signal: ctx.signal,
        timeoutMs: 30_000
    });
    const combined = result.all ?? `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const durationMs = stopwatch();
    const { uri } = storeReport({
        tool: 'auth_status',
        title: 'auth_status output',
        body: combined,
        durationMs
    });
    if ((result.exitCode ?? 0) !== 0) {
        await log.error('auth status failed', { exitCode: result.exitCode, uri });
        throw new Error(`coderabbit auth status failed with code ${result.exitCode}. See ${uri}`);
    }
    const match = combined.match(/Logged in as\s+(.+)/i);
    const summary = match ? `Logged in as ${match[1].trim()}` : 'Login status output available in report.';
    await log.success('auth status retrieved', { uri, summary }, durationMs);
    return {
        content: [
            {
                type: 'text',
                text: `${summary}\nReport: ${uri}`
            }
        ]
    };
}
//# sourceMappingURL=authStatus.js.map