# coderabbit-cli-mcp

English documentation lives here. A full Japanese version is available in `README.ja.md`.

## Overview
- A minimal Model Context Protocol (MCP) server that exposes the CodeRabbit CLI through the `run_review` tool.
- No other helper tools are provided; setup guidance (installation/auth hints) is embedded in the `run_review` error messages themselves.
- Every invocation streams structured logs and stores combined stdout/stderr under `report://` resources for later inspection.

## Provided Tool
| Tool | Role | Key arguments |
| ---- | ---- | ------------- |
| `run_review` | Executes `coderabbit` with full flag coverage. If the CLI is missing or unauthenticated, the same response returns OS-specific setup guidance plus a reminder for Codex to consult the user. | `mode`, `type`, `base`, `baseCommit`, `cwd`, `configFiles[]`, `noColor`, `timeoutSec`, `extraArgs[]` |

## Security & Operating Notes
- The MCP server never attempts to install CodeRabbit or perform `auth login` automatically. Follow the guidance printed by `run_review` and execute commands manually in your own shell.
- Codex (or any MCP client) **must not** run additional commands on its own when an error occurs. Report the guidance back to the user and wait for explicit instructions before retrying.
- Windows native is unsupported; WSL2 instructions are provided instead. PATH modifications also remain manual.

## Development
```bash
# Install dependencies
npm install

# Type-check & build (creates dist/server.js)
npm run build

# Run the MCP server in dev mode (tsx)
npm run dev
```

## Quickstart (Codex CLI)
Register the server via `codex mcp add` so agents can call `/mcp coderabbit-cli-mcp` directly:
```bash
codex mcp add coderabbit-cli-mcp \
  --env TSX_BANNER=false \
  -- "$(pwd)/node_modules/.bin/tsx" \
  "$(pwd)/src/server.ts"
```
After registration you can inspect tools with `codex mcp call coderabbit-cli-mcp tools/list` or trigger `run_review` via `codex mcp call`.

## CLI Smoke Tests
```bash
# List tools through the MCP inspector
npx @modelcontextprotocol/inspector \
  --cli node dist/server.js \
  --method tools/list

# Call run_review (plain output against uncommitted changes)
npx @modelcontextprotocol/inspector \
  --cli node dist/server.js \
  --method tools/call \
  --tool-name run_review \
  --tool-arg mode=plain \
  --tool-arg type=uncommitted

# List report:// resources for recent runs
npx @modelcontextprotocol/inspector \
  --cli node dist/server.js \
  --method resources/list

# List prompts
npx @modelcontextprotocol/inspector \
  --cli node dist/server.js \
  --method prompts/list
```

## npm Publish Checklist
```bash
npm run build
npm pkg fix
npm version patch   # or minor / major as needed
npm publish --access public
npm view coderabbit-cli-mcp version
```
