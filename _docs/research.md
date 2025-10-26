# Research memo

## CodeRabbit CLI 要点
- `coderabbit --plain` / `--prompt-only` / `--type` などの主要フラグは公式ブログおよび CLI walkthrough で確認。AI 連携時は `--prompt-only` が推奨されている。citeturn3search0
- 公式のインストール手順は `curl -fsSL https://cli.coderabbit.ai/install.sh | sh` であり、Windows では WSL2 推奨。README でも curl | sh 実行前に内容を確認するよう注意喚起されている。citeturn3search1

## MCP 実装方針
- `@modelcontextprotocol/sdk` の registerTool / registerPrompt / registerResource API を利用し、リソースには LRU で `report://{id}` を割り当てる。
- 進捗通知は `notifications/progress` を直接送信する必要があるため、`RequestHandlerExtra` の `_meta.progressToken` を尊重する実装にした。
- CLI 実行は `execa` で統一し、JSON 行ログへすべての stdout/stderr/exitCode/所要時間を記録する。

## o3 MCP 相談状況
- `mcp__o3__o3-search` による設計相談を 4 回試行したが、いずれも request timeout で失敗。現時点では外部ガイダンスを得られていないため、実装内コメントと `_docs` でタイムアウトを明記している。
