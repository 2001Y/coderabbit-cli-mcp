# coderabbit-cli-mcp

CodeRabbit CLI を Model Context Protocol (MCP) で実行するサーバーです。提供ツールは `run_review` のみで、CLI 未導入や未認証などの初回セットアップ情報も同じツールのエラーメッセージ内で案内します。実行ログはログ通知＋`report://` リソースで再参照できます。

## クイックスタート（Codex CLI 例）

`codex mcp add` でローカルプロジェクトをそのまま登録できます。

```bash
codex mcp add coderabbit-cli-mcp \
  --env TSX_BANNER=false \
  -- "$(pwd)/node_modules/.bin/tsx" \
  "$(pwd)/src/server.ts"
```

## 提供ツール

| Tool         | 役割                                                                                             | 主要引数                                                                                             |
| ------------ | ------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------- |
| `run_review` | CodeRabbit CLI を全オプション指定で実行。CLI が未導入/未認証の場合は同じレスポンスで案内を返す。 | `mode`, `type`, `base`, `baseCommit`, `cwd`, `configFiles[]`, `noColor`, `timeoutSec`, `extraArgs[]` |

## セキュリティ注意

- MCP サーバーはインストールやブラウザログインを自動実行しません。`run_review` のエラーメッセージで表示される手順を参考に、実際のコマンドはユーザー自身の環境で実行してください。
- Windows ネイティブは非対応。WSL2 上での実行手順のみ案内し、フォールバックは行いません。
- PATH 追記は自動化せず、必要事項をログ/出力で案内します。
- エラーが発生した場合、Codex（クライアント側）は自力でコマンドを追加実行せず、`run_review` が返す案内をユーザーへ報告して指示を仰ぐ運用としてください。

## 開発メモ

```bash
# ビルドなし（tsx で直接実行）
TSX_BANNER=false npx @modelcontextprotocol/inspector \
  --cli ./node_modules/.bin/tsx \
  --args src/server.ts \
  --method tools/list

# ビルドせず tsx で登録（プロジェクトルートで実行）
codex mcp add coderabbit-cli-dev \
  --env TSX_BANNER=false \
  -- "$(pwd)/node_modules/.bin/tsx" \
  "$(pwd)/src/server.ts"

# npm公開
npm publish --access public
```
