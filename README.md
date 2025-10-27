# coderabbit-cli-mcp

English documentation lives here. A full Japanese version is available in `README.ja.md`.

`run_review` is the only MCP tool this server exposes. When the CodeRabbit CLI is missing or unauthenticated, the same tool response explains how to bootstrap it and reminds Codex to report back to the user instead of acting autonomously.

## Quickstart (Codex CLI)
### Published package (`npx`)
```bash
codex mcp add coderabbit-cli-mcp \
  -- "npx" \
  "-y" \
  "coderabbit-cli-mcp"
```

### Development checkout (local `tsx`)
```bash
codex mcp add coderabbit-cli-mcp \
  --env TSX_BANNER=false \
  -- "$(pwd)/node_modules/.bin/tsx" \
  "$(pwd)/src/server.ts"
```
After registration you can inspect tools with `codex mcp call coderabbit-cli-mcp tools/list` or trigger `run_review` via `codex mcp call`.

## Codex config (client-side)
`~/.codex/config.toml` controls how Codex launches MCP servers. Start with the minimal entry above, then add optional knobs:

```toml
[mcp_servers.coderabbit-cli-mcp]
command = "npx"
args = ["coderabbit-cli-mcp@latest"]
tool_timeout_sec = 1800  # allow up to 30 minutes (default 60)
# startup_timeout_sec = 60

[mcp_servers.coderabbit-cli-mcp.env]
# CODERRABBIT_MCP_LOCK_MODE = "plain"
# CODERRABBIT_MCP_LOCK_TYPE = "uncommitted"
# CODERRABBIT_MCP_LOCK_CONFIG_FILES = "[\".coderabbit.yaml\"]"
# CODERRABBIT_TOOL_TIMEOUT_SEC = "1800"
```

- Uncomment the optional lines you need. Keep `command`/`args` as-is for a published install, or swap them for the local `tsx` command from the quickstart section.
- `tool_timeout_sec` should be ≥600 whenever reviews may run longer than a minute.
- `CODERRABBIT_MCP_LOCK_MODE` / `_TYPE` take plain strings.
- `CODERRABBIT_MCP_LOCK_CONFIG_FILES` must be a JSON array (CodeRabbit’s `-c` flag accepts multiple files, so list all required config paths there).
- `CODERRABBIT_TOOL_TIMEOUT_SEC` should match the value you assign to `tool_timeout_sec` so this server can confirm the configuration.
- These environment variables are **not** accepted via MCP tool arguments; Codex’s environment is the only place to set them.
- Because the environment carries these values, no extra server-side config files are required.

## Provided Tool
| Tool | Role | Key arguments |
| ---- | ---- | ------------- |
| `run_review` | Executes `coderabbit` with full flag coverage. If the CLI is missing or unauthenticated, the same response includes setup guidance and instructs Codex to ask the user. | `mode`, `type`, `base`, `baseCommit`, `cwd`, `extraArgs[]` |

### run_review arguments
| Argument | Type | Description | Default |
| -------- | ---- | ----------- | ------- |
| `mode` | `interactive`\|`plain`\|`prompt-only` | Mirrors the CodeRabbit CLI output format. | `plain` |
| `type` | `all`\|`committed`\|`uncommitted` | Selects the diff scope passed to CodeRabbit. | `all` |
| `base` | `string` | Overrides the base branch (`--base`). | unset |
| `baseCommit` | `string` | Overrides the base commit (`--base-commit`). | unset |
| `cwd` | `string` | Directory from which the CLI runs; must exist. | server `process.cwd()` |
| `configFiles` | `string[]` | Pre-configured via `CODERRABBIT_MCP_LOCK_CONFIG_FILES` (JSON array). | unset |
| `extraArgs` | `string[]` | Appended verbatim to the CLI argv (use sparingly). | unset |

- `--no-color` is always appended so MCP clients receive plain output.
- Only `mode`/`type`/`configFiles` can be pre-configured through Codex; all other arguments must be supplied per-tool invocation.

## Security & Operating Notes
- The server never attempts to install CodeRabbit or run `coderabbit auth login`. Follow the emitted guidance and execute commands manually in your own shell.
- Codex (or any MCP client) **must not** run additional commands on its own when an error occurs. Report the guidance back to the user and wait for explicit instructions before retrying.
- Windows native is unsupported; WSL2 instructions are provided instead. PATH modifications also remain manual.
- The MCP server does not read Codex’s `AGENTS.md` dynamically. Keep governance rules in `AGENTS.md`, and rely on the environment variables above to enforce `mode`/`type`.

## Development
```bash
npm install
npm run build
npm run dev
```

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
