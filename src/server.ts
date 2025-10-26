import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import pkg from '../package.json' with { type: 'json' };
import { registerResources } from './resources/outputsStore.js';
import { registerPrompts } from './prompts.js';
import { registerLogTransmitter, type LogEntry } from './logger.js';
import { runReview, RunReviewArgsSchema, type RunReviewArgs } from './tools/runReview.js';
import { ensureCli, EnsureCliArgsSchema } from './tools/ensureCli.js';
import { installCli, InstallCliArgsSchema } from './tools/installCli.js';
import { authLogin, AuthLoginArgsSchema } from './tools/authLogin.js';
import { authStatus } from './tools/authStatus.js';
import { version } from './tools/version.js';
import { cliHelp } from './tools/cliHelp.js';
import { writeConfig, WriteConfigArgsSchema } from './tools/writeConfig.js';
import { doctor, DoctorArgsSchema } from './tools/doctor.js';

const server = new McpServer(
  { name: 'coderabbit-cli-mcp', version: pkg.version },
  {
    capabilities: {
      logging: { levels: ['debug', 'info', 'notice', 'warning', 'error'] },
      tools: {},
      prompts: {},
      resources: {}
    },
    instructions:
      'Use run_review for CodeRabbit CLI execution, ensure_cli/install_cli for bootstrap, and auth_* tools for authentication. Outputs are mirrored under report:// resources.'
  }
);

type LoggingLevel = 'debug' | 'info' | 'notice' | 'warning' | 'error' | 'critical' | 'alert' | 'emergency';

const levelMap: Record<LogEntry['level'], LoggingLevel> = {
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
  } catch {
    // fall back silently; stderr already received the log
  }
});

server.tool('run_review', RunReviewArgsSchema.shape, async (args, ctx) => runReview(args as RunReviewArgs, ctx));
server.tool('ensure_cli', EnsureCliArgsSchema.shape, (args, ctx) => ensureCli(args, ctx));
server.tool('install_cli', InstallCliArgsSchema.shape, (args, ctx) => installCli(args, ctx));
server.tool('auth_login', AuthLoginArgsSchema.shape, (args, ctx) => authLogin(args, ctx));
server.tool('auth_status', async (ctx) => authStatus(ctx));
server.tool('version', () => version());
server.tool('cli_help', () => cliHelp());
server.tool('write_config', WriteConfigArgsSchema.shape, (args) => writeConfig(args));
server.tool('doctor', DoctorArgsSchema.shape, (args) => doctor(args));

registerResources(server);
registerPrompts(server);

const transport = new StdioServerTransport();
await server.connect(transport);
