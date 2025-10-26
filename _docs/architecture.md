# coderabbit-cli-mcp アーキテクチャ設計メモ

## 目的
- CodeRabbit CLI を MCP の `run_review` ツール 1 本で実行できるゲートウェイ。
- CLI 未導入・未認証などの初回セットアップ情報も `run_review` のレスポンス内で案内し、追加ツールを不要にする。
- 進捗・ログ・リソースを MCP 標準（notifications/progress・resources・prompts）に沿って提供。
- 失敗は必ず ERROR として顕在化させ、必要な対処ガイドを同じメッセージで提示する。

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
    coderabbit.ts           // バイナリ検出/キャッシュ、バージョン確認
  tools/
    runReview.ts            // 唯一の実行ツール。セットアップガイドも内包
    installGuide.ts         // OS 別インストール手順を生成するヘルパー
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

## 初回セットアップ誘導
- `run_review` が coderabbit バイナリを検出できない場合、OS 判定付きのインストール & 認証手順を ERROR メッセージ内で返す。
- CLI 実行が exit code ≠ 0 だった場合も stdout/stderr を解析し、「未ログイン」「設定不足」など代表的な初回エラーに対する手順を返す。
- 追加ツールでの再実行は不要。ユーザーは案内通りに CLI をセットアップし、同じ `run_review` を再実行するだけでよい。

## プロンプト
- `review_local_uncommitted`: mode=plain, type=uncommitted。
- `review_all_plain`: mode=plain, type=all。
- `prompt_only_uncommitted`: mode=prompt-only, type=uncommitted。
- 各プロンプトは `toolInvocation` として JSON サンプルを返し、再現性を担保。

## 参考リサーチ
- MCP SDK (TS) API & progress token: `@modelcontextprotocol/sdk@1.20.2`。
- CodeRabbit CLI install/auth/options: 公式 README / --help / install.sh（o3 MCP サマリ参照）。
- o3-search ガイダンス: サブプロセス安全化、ログ設計、report:// リソース保持戦略。
