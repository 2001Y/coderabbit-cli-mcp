# coderabbitai-cli-mcp アーキテクチャ設計メモ

## 目的
- CodeRabbit CLI を MCP Tools としてフル操作できるゲートウェイ。
- CLI 未導入環境でも `ensure_cli` → `install_cli` → `auth_login` → `run_review` までワンストップで自動化。
- 進捗・ログ・リソースを MCP 標準（notifications/progress・resources・prompts）に沿って提供。
- 失敗や未知フラグを握りつぶさず「即エラー」で顕在化。

## モジュール構成
```
src/
  server.ts                 // MCP サーバー bootstrap（stdio/将来 HTTP）
  logger.ts                 // ログレベル (INFO/DEBUG/SUCCESS/WARNING/ERROR) + duration 計測
  progress.ts               // progressToken 付き notifications/progress 送信ヘルパー
  types.ts                  // RequestHandlerExtra エイリアス
  prompts.ts                // プリセット MCP プロンプト
  resources/outputsStore.ts // report://{tool}/{id} ストア + resource/list/read 実装
  lib/
    coderabbit.ts           // バイナリ検出/キャッシュ、バージョン確認、共通 env
    process.ts              // execa ベースの subprocess 走行 + ログ/リソース連携
    template.ts             // write_config 用テンプレ生成
    git.ts                  // doctor 用 git/リポジトリ診断
  tools/
    runReview.ts, ensureCli.ts, installCli.ts, authLogin.ts,
    authStatus.ts, version.ts, cliHelp.ts, writeConfig.ts, doctor.ts
```

## ロギング方針
- すべてのツール入口/出口で `logger.info/debug/success/error` を発火。
- `logEmitter` 経由で stderr と MCP logging notification の両方へ出力。
- ログフィールド: `ts`, `level`, `scope`, `message`, `durationMs`, `meta`（argv/cwd/exitCode 等）。
- CLI 標準出力は DEBUG（個別行）、要約/異常は WARNING/ERROR。
- 失敗理由・提案（例: PATH 追記）が message に含まれる。

## プログレス
- `progress.ts` が `_meta.progressToken` を抽出。
- `reportPhase(percent, label)` で 5 ステップ（boot/scanning/analyzing/formatting/done）を通知。
- トークン未指定時は no-op。

## リソース
- `outputsStore` が LRUCache(max=100, ttl=6h)。
- URI: `report://{tool}/{timestamp}-{shortid}`。list/read の両方を登録。
- 内容は text (UTF-8) + metadata(summary, bytes, duration)。
- どのツールも `storeReport` を呼び、戻り値の URI を結果に含める。

## サブプロセス・安全性
- すべて `execa` を shell:false で実行。argv は配列構築関数 `buildRunArgs` が担当。
- `AbortSignal` と timeout(ms) を `execa` に渡し、キャンセル時は SIGTERM → SIGKILL。
- `extraArgs` はそのまま末尾へ。既知フラグとの衝突は検出して ERROR。
- config ファイルは `fs.accessSync` で存在確認し、正規化した絶対パスを渡す。

## インストール/認証フロー
- `ensure_cli` が `resolveCoderabbitBinary()` → 失敗時 `install_cli` を呼び出し。
- `install_cli` は macOS/Linux のみ直接インストール。Windows は WSL2 手順案内。
- 実行前に INFO ログでコマンド全文を提示。`confirm: true` を要求（dryRun は常に許可）。
- 認証ツール：`auth_login` が `coderabbit auth login --no-browser`（可能なら）を実行し、URL を抽出。
- `auth_status` は `coderabbit auth status` を走らせ、整形テキスト + 生ログ（report://）を返す。

## プロンプト
- `review_local_uncommitted`: mode=plain, type=uncommitted。
- `review_all_plain`: mode=plain, type=all。
- `prompt_only_uncommitted`: mode=prompt-only, type=uncommitted。
- 各プロンプトは `toolInvocation` として JSON サンプルを返し、再現性を担保。

## 参考リサーチ
- MCP SDK (TS) API & progress token: `@modelcontextprotocol/sdk@1.20.2`。
- CodeRabbit CLI install/auth/options: 公式 README / --help / install.sh（o3 MCP サマリ参照）。
- o3-search ガイダンス: サブプロセス安全化、ログ設計、report:// リソース保持戦略。

