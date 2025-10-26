import express from "express";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import pkg from "../package.json" assert { type: "json" };
import { registerResources } from "./resources/outputsStore.js";
import { registerPrompts } from "./prompts.js";
import { runReview } from "./tools/runReview.js";
import { ensureCli } from "./tools/ensureCli.js";
import { installCli } from "./tools/installCli.js";
import { authLogin } from "./tools/authLogin.js";
import { authStatus } from "./tools/authStatus.js";
import { version as cliVersion } from "./tools/version.js";
import { cliHelp } from "./tools/cliHelp.js";
import { writeConfig } from "./tools/writeConfig.js";
import { doctor } from "./tools/doctor.js";
import {
  RunReviewInputSchema,
  EnsureCliInputSchema,
  InstallCliInputSchema,
  WriteConfigSchema,
  DoctorSchema,
  type RunReviewInput,
} from "./types.js";

const server = new McpServer({
  name: "coderabbitai-cli-mcp",
  version: (pkg as { version?: string }).version ?? "0.1.0",
});

registerResources(server);
registerPrompts(server);

server.registerTool(
  "run_review",
  {
    title: "CodeRabbit CLI 実行",
    description: "CodeRabbit CLI を全オプション指定で実行します",
    inputSchema: RunReviewInputSchema.shape,
  },
  (args, extra) => runReview(args as RunReviewInput, extra),
);

server.registerTool(
  "ensure_cli",
  {
    title: "CodeRabbit CLI の検出/導入",
    inputSchema: EnsureCliInputSchema.shape,
  },
  (args, extra) => ensureCli(args, extra),
);

server.registerTool(
  "install_cli",
  {
    title: "CodeRabbit CLI インストール",
    inputSchema: InstallCliInputSchema.shape,
  },
  (args, extra) => installCli(args, extra),
);

server.registerTool(
  "auth_login",
  { title: "CodeRabbit CLI ログイン" },
  (_, extra) => authLogin({}, extra),
);
server.registerTool(
  "auth_status",
  { title: "CodeRabbit ログイン状態" },
  (_, extra) => authStatus({}, extra),
);
server.registerTool("version", { title: "CodeRabbit CLI バージョン" }, (_, extra) => cliVersion({}, extra));
server.registerTool("cli_help", { title: "CodeRabbit CLI --help" }, (_, extra) => cliHelp({}, extra));
server.registerTool(
  "write_config",
  {
    title: ".coderabbit.yaml を生成",
    inputSchema: WriteConfigSchema.shape,
  },
  (args, extra) => writeConfig(args, extra),
);
server.registerTool(
  "doctor",
  {
    title: "環境診断",
    inputSchema: DoctorSchema.shape,
  },
  (args, extra) => doctor(args, extra),
);

function parseFlags() {
  const argv = process.argv.slice(2);
  let httpPort: number | null = null;

  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--http") {
      httpPort = 3030;
    } else if (arg.startsWith("--http=")) {
      httpPort = Number(arg.split("=")[1]) || 3030;
    } else if (arg === "--http-port") {
      const value = argv[i + 1];
      if (value) {
        httpPort = Number(value) || 3030;
        i += 1;
      }
    } else if (arg === "--stdio") {
      httpPort = null;
    }
  }

  return { httpPort };
}

async function startHttpServer(port: number) {
  const app = express();
  app.use(express.json({ limit: "10mb" }));

  app.post("/mcp", async (req, res) => {
    const transport = new StreamableHTTPServerTransport({
      enableJsonResponse: true,
    });
    res.on("close", () => transport.close());
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
  });

  await new Promise<void>((resolve, reject) => {
    app
      .listen(port, () => {
        console.log(`coderabbitai-cli-mcp HTTP server listening on http://localhost:${port}/mcp`);
        resolve();
      })
      .on("error", reject);
  });
}

async function start() {
  const { httpPort } = parseFlags();
  if (httpPort) {
    await startHttpServer(httpPort);
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
}

await start();
