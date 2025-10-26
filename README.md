# coderabbitai-cli-mcp

CodeRabbit CLI を Model Context Protocol (MCP) で完全操作するサーバーです。`run_review` で全フラグを JSON 指定しつつ、`ensure_cli`/`install_cli` が未導入環境でもブートストラップを実施します。実行ログはログ通知＋`report://` リソースで再参照できます。

## クイックスタート

```bash
# 1-shot 実行（npm 未インストールでも npx だけで起動）
npx -y coderabbitai-cli-mcp
```

クライアント設定例（Claude Desktop）:

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

## 提供ツール

| Tool | 役割 | 主要引数 |
| --- | --- | --- |
| `run_review` | CodeRabbit CLI を全オプション指定で実行。stdout/stderr は `report://run_review/...` に保存。 | `mode`, `type`, `base`, `baseCommit`, `cwd`, `configFiles[]`, `noColor`, `timeoutSec`, `extraArgs[]` |
| `ensure_cli` | CLI 検出→必要なら `install_cli` を自動起動。 | `dryRun`, `force` |
| `install_cli` | macOS/Linux で公式 `curl | sh` インストーラ実行（`confirm=true` 必須）。 | `dryRun`, `confirm` |
| `auth_login` | `coderabbit auth login` を実行し、URL を抽出。 | `extraArgs[]` |
| `auth_status` | `coderabbit auth status` の結果をサマリ＋レポート化。 | なし |
| `version` | `coderabbit --version` 出力。 | なし |
| `cli_help` | `coderabbit --help` を実行し、フラグ一覧を JSON 化。 | なし |
| `write_config` | `.coderabbit.yaml` 雛形を生成（上書き禁止が既定）。 | `path`, `overwrite` |
| `doctor` | git / リポジトリ状態 / coderabbit バイナリ有無を診断。 | `cwd` |

## ログ & リソース

- ログレベル: INFO / DEBUG / SUCCESS / WARNING / ERROR。すべてにタイムスタンプとメタデータ（argv, cwd, exitCode, durationMs 等）を付与。
- MCP `notifications/progress` を用い、「boot → scanning → analyzing → formatting → done」の進捗を通知。
- 直近 100 件の CLI 出力を `report://{tool}/{id}` に保存。`resources/list` から参照でき、`resources/read` で全文が取得可能。

## セキュリティ注意

- `install_cli` は `confirm=true` を必須とし、実行前に実コマンドを INFO ログで通知。
- Windows ネイティブは非対応。WSL2 上での実行手順のみ案内し、フォールバックは行いません。
- PATH 追記は自動化せず、必要事項をログ/出力で案内します。

## 開発

```bash
# 依存関係
npm install

# 型チェック + ビルド (dist/server.js 作成)
npm run build

# 開発モード（ts-node 実行）
npm run dev
```

公開手順は通常の npm publish ワークフローに従います（Semantic Versioning）。
