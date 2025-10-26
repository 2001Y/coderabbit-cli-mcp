# coderabbitai-cli-mcp

CodeRabbit CLI を Model Context Protocol (MCP) で完全操作するサーバーです。未インストール環境でも *ensure_cli* ひとつで検出・インストール・認証誘導・動作確認までを自動化し、LLM クライアントから CodeRabbit CLI のすべてのオプションを安全に制御できます。

## 特徴
- **全オプション対応の `run_review`**: mode/type/base/base-commit/cwd/configFiles/no-color/extraArgs/timeout を JSON で指定可能。未知のフラグも `extraArgs` にバイパス。
- **ブートストラップ支援**: `ensure_cli` / `install_cli` が `curl -fsSL https://cli.coderabbit.ai/install.sh | sh` を安全ガード付きで実行し、PATH 追記は提案のみで自動変更しません。
- **完全ログ主義**: すべてのツールが JSON 行ログ（timestamp, level, tool, requestId, meta）を `stderr` に出力。入力/分岐/外部 I/O/出力/所要時間を追跡できます。
- **結果キャッシュ**: 直近 20 件の CLI 出力を `report://{id}` リソースとして LRU 保持し、LLM が後から比較可能。
- **プリセットプロンプト**: `review-local` / `review-all` / `prompt-only-uncommitted` を MCP Prompt として提供。
- **Transports**: 既定は stdio。`--http[=<port>]` で Streamable HTTP モードを起動（後方互換として SSE ではなく Streamable HTTP）。

## 使い方
```bash
# 1-shot 実行（stdio）
npx -y coderabbitai-cli-mcp

# HTTP モード（デフォルト 3030）
npx -y coderabbitai-cli-mcp --http=4000
```

Claude Desktop / VS Code などでは以下のように設定できます。
```json
{
  "mcpServers": {
    "coderabbitai-cli-mcp": {
      "command": "npx",
      "args": ["-y", "coderabbitai-cli-mcp"]
    }
  }
}
```

## MCP Tools
| 名前 | 説明 |
| --- | --- |
| `run_review` | CodeRabbit CLI のレビューをすべてのフラグ付きで実行、進捗通知 + LRU リソース化 |
| `ensure_cli` | CLI 検出 → 必要ならインストール → バージョン検証 |
| `install_cli` | 明示的に `curl | sh` を実行（dry-run オプションあり） |
| `auth_login` / `auth_status` | 認証 URL 抽出とログイン状態確認 |
| `version` / `cli_help` | `coderabbit --version / --help` の結果を返却、ヘルプは自動パース付き |
| `write_config` | `.coderabbit.yaml` テンプレートを安全に生成（force 無しで上書き禁止） |
| `doctor` | Git / CLI / PATH を診断し、開発体験を向上させるヒントを返す |

### `run_review` 引数
```json
{
  "mode": "interactive" | "plain" | "prompt-only",
  "type": "all" | "committed" | "uncommitted",
  "base": "string",
  "baseCommit": "string",
  "cwd": "string",
  "configFiles": ["./AGENTS.md"],
  "noColor": true,
  "timeoutSec": 3600,
  "extraArgs": ["--plain"]
}
```
進捗通知は `boot → scanning → analyzing → formatting → done` の 5 ステップで送信されます。

## セキュリティとガード
- `curl | sh` 実行前に dry-run で内容を提示可能。PATH の書き換えは一切自動化せず、追記案内のみを返す方針です。
- すべての外部プロセスにタイムアウト/キャンセル/exit-code チェックを設定し、失敗は例外として即時顕在化します。
- ログは JSON 行で `stderr` に送出されるため、LLM クライアントからも容易に収集・再生可能です。

## HTTP トランスポート
```
npx -y coderabbitai-cli-mcp --http=3030
```
`POST /mcp` に Streamable HTTP で接続できます。セッション管理が不要な stateless モードのため、1 リクエストごとに新しいトランスポートを作成しています。

## 動作確認チェックリスト
1. `ensure_cli`（未インストール環境）→ `version` で検証
2. `auth_login` → 取得した URL でブラウザ認証 → `auth_status`
3. `run_review { mode: "prompt-only", type: "uncommitted" }`
4. `run_review { mode: "plain", type: "all", configFiles: ["./AGENTS.md"] }`

## ライセンス
[MIT](LICENSE)
