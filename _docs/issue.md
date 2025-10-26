# Issue backlog

1. **HTTP セッションの同時実行安全性**
   - 現状は HTTP リクエストごとに `StreamableHTTPServerTransport` を生成しているが、同時実行が増えると 1 つの `McpServer` での多重接続がボトルネックになる懸念がある。
   - 対応案: セッション ID ベースの transport 管理 or リクエストごとに `McpServer` を生成。

2. **o3 アーキテクチャ助言の欠如**
   - o3 MCP への問い合わせが全て timeout となり、公式な設計レビューを得られていない。
   - 対応案: サービス復旧後に再度質問し、ログに記録。

3. **CLI ヘルプ構造の自動同期**
   - `cli_help` は Zod スキーマを動的に更新しないため、CLI 側で新フラグが追加された際に README との乖離が発生しうる。
   - 対応案: `cli_help` のパース結果を README に反映するスクリプトを追加。
