# coderabbit-cli-mcp (日本語)

`run_review` ツール 1 本で CodeRabbit CLI を MCP から呼び出すサーバーです。CLI が未導入/未認証の場合でも、同じツールのエラーメッセージ内で手順を案内します。

### クイックスタート（Codex CLI）

```bash
codex mcp add coderabbit-cli-mcp \
  -- "npx" \
  "-y" \
  "coderabbit-cli-mcp"
```

## Codex 側の設定例

`~/.codex/config.toml` にオプションを追記してタイムアウトや引数の既定値を調整できます。

```toml
[mcp_servers.coderabbit-cli-mcp]
command = "npx"
args = ["coderabbit-cli-mcp@latest"]
# tool_timeout_sec = 1800  # 7〜30分のレビューを想定
# startup_timeout_sec = 60

[mcp_servers.coderabbit-cli-mcp.env]
# CODERRABBIT_MCP_LOCK_MODE = "plain"
# CODERRABBIT_MCP_LOCK_TYPE = "uncommitted"
# CODERRABBIT_MCP_LOCK_CONFIG_FILES = '[".coderabbit.yaml"]'
```

- `tool_timeout_sec` は既定 60 秒なので、引き上げることを推奨します。7 分から 30 分と公式ドキュメントには書かれている。
- `CODERRABBIT_MCP_LOCK_MODE` / `_TYPE` は文字列、`_CONFIG_FILES` は JSON 配列（CodeRabbit の `-c` フラグは複数指定可）で記述します。
- これらの値は MCP 呼び出しの引数よりも優先され、上書きされた内容はログに出力されます。

## 提供ツール

| Tool         | 役割                                                                                                                  | 主要引数                                                   |
| ------------ | --------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| `run_review` | CodeRabbit CLI を完全な引数セットで実行。障害時はその場でセットアップ手順と「ユーザーへ報告して指示を仰ぐ」旨を返す。 | `mode`, `type`, `base`, `baseCommit`, `cwd`, `extraArgs[]` |

### run_review の引数

| 引数          | 型                                      | 説明                                                   | 既定値                           |
| ------------- | --------------------------------------- | ------------------------------------------------------ | -------------------------------- |
| `mode`        | `interactive` / `plain` / `prompt-only` | CodeRabbit CLI の出力モード                            | `plain`                          |
| `type`        | `all` / `committed` / `uncommitted`     | レビュー対象範囲                                       | `all`                            |
| `base`        | `string`                                | `--base` に相当                                        | 指定なし                         |
| `baseCommit`  | `string`                                | `--base-commit` に相当                                 | 指定なし                         |
| `cwd`         | `string`                                | CLI 実行ディレクトリ（存在必須）                       | サーバー起動時の `process.cwd()` |
| `configFiles` | `string[]`                              | `CODERRABBIT_MCP_LOCK_CONFIG_FILES`（JSON 配列）で固定 | 指定なし                         |
| `extraArgs`   | `string[]`                              | 末尾に付与する追加引数                                 | 指定なし                         |

- `--no-color` は常に付与され、MCP クライアントにはプレーンテキストで渡ります。
- MCP サーバー側で独自タイムアウトは設定しません（CodeRabbit CLI の挙動に従います）。
- Codex 側で固定できるのは `mode` / `type` / `configFiles` のみです。それ以外の引数（`base` など）は MCP ツール呼び出し時に指定してください。

## セキュリティ / 運用メモ

- インストールや `coderabbit auth login` は自動実行しません。`run_review` が表示する手順に従い、利用者自身のターミナルで作業してください。
- Windows ネイティブは非対応。WSL2 でのセットアップ手順を案内します。PATH 追記も手動です。

---

## 開発中ローカル（tsx 実行）

```bash
codex mcp add coderabbit-cli-mcp \
  --env TSX_BANNER=false \
  -- "$(pwd)/node_modules/.bin/tsx" \
  "$(pwd)/src/server.ts"
```
