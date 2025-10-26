import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pkg from '../package.json' with { type: 'json' };
import { registerResources } from './resources/outputsStore.js';
import { registerPrompts } from './prompts.js';
import { registerLogTransmitter } from './logger.js';
import { runReview, RunReviewArgsSchema } from './tools/runReview.js';
const server = new McpServer({ name: 'coderabbit-cli-mcp', version: pkg.version }, {
    capabilities: {
        logging: { levels: ['debug', 'info', 'notice', 'warning', 'error'] },
        tools: {},
        prompts: {},
        resources: {}
    },
    instructions: 'Use run_review to execute CodeRabbit reviews. Setup or authentication guidance is returned inline when prerequisites are missing. Outputs are mirrored under report:// resources.'
});
const levelMap = {
    DEBUG: 'debug',
    INFO: 'info',
    SUCCESS: 'notice',
    WARNING: 'warning',
    ERROR: 'error'
};
registerLogTransmitter(async (entry) => {
    if (!server.isConnected()) {
        return;
    }
    try {
        await server.server.sendLoggingMessage({
            level: levelMap[entry.level],
            logger: entry.scope,
            data: {
                message: entry.message,
                durationMs: entry.durationMs,
                meta: entry.meta
            }
        });
    }
    catch (error) {
        const failure = {
            ts: new Date().toISOString(),
            scope: entry.scope,
            level: entry.level,
            message: entry.message,
            meta: entry.meta,
            err: error instanceof Error
                ? { name: error.name, message: error.message, stack: error.stack }
                : { value: String(error) }
        };
        console.error(`[server.logging] failed to forward log to MCP: ${JSON.stringify(failure)}`);
    }
});
server.tool('run_review', RunReviewArgsSchema.shape, async (args, ctx) => runReview(args, ctx));
registerResources(server);
registerPrompts(server);
const transport = new StdioServerTransport();
await server.connect(transport);
//# sourceMappingURL=server.js.map