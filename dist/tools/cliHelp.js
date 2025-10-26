import { runCoderabbitSubcommand } from '../lib/coderabbit.js';
import { createLogger, createStopwatch } from '../logger.js';
import { storeReport } from '../resources/outputsStore.js';
const log = createLogger('tools.cli_help');
function parseFlags(helpText) {
    const descriptors = [];
    const lines = helpText.split(/\r?\n/);
    const flagLine = /^\s*(?:(-\w),\s*)?(--[\w-]+)(?:\s+<([^>]+)>)?\s*(.*)$/;
    for (const line of lines) {
        const match = flagLine.exec(line);
        if (!match)
            continue;
        const [, shortFlag, longFlag, param, desc] = match;
        descriptors.push({
            flag: longFlag,
            alias: shortFlag ?? undefined,
            parameter: param ?? undefined,
            description: desc?.trim() || undefined
        });
    }
    return descriptors;
}
export async function cliHelp() {
    const stopwatch = createStopwatch();
    const result = await runCoderabbitSubcommand(['--help'], {
        timeoutMs: 15_000
    });
    const combined = result.all ?? `${result.stdout ?? ''}\n${result.stderr ?? ''}`;
    const durationMs = stopwatch();
    const { uri } = storeReport({
        tool: 'cli_help',
        title: 'cli_help output',
        body: combined,
        durationMs
    });
    if ((result.exitCode ?? 0) !== 0) {
        await log.error('help command failed', { exitCode: result.exitCode, uri });
        throw new Error(`coderabbit --help failed with code ${result.exitCode}. See ${uri}`);
    }
    const flags = parseFlags(combined);
    await log.success('parsed help output', { flagCount: flags.length, uri }, durationMs);
    return {
        content: [
            {
                type: 'text',
                text: `cli_help captured ${flags.length} flags. report: ${uri}`
            },
            {
                type: 'text',
                text: JSON.stringify(flags, null, 2)
            }
        ]
    };
}
//# sourceMappingURL=cliHelp.js.map