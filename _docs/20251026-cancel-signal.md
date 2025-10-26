# cancelSignal / ログ可観測性 対応設計メモ (2025-10-26)

## 背景ログ
> ※ 2025-10-26 の再設計で `ensure_cli` / `install_cli` ツール自体は廃止し、`run_review` 内で案内する方針に変更済み。以下は当時の障害ログとして残している。

- `coderabbit-cli-dev.ensure_cli` 実行時に `The "signal" option has been renamed to "cancelSignal" instead.` が発生し、CodeRabbit CLI インストーラが一切走らない。
- その結果、`run_review` などすべての CLI 呼出が `coderabbit CLI not found on PATH...` で失敗し、MCP ツールが利用不可能。
- server.ts のログ転送処理では `sendLoggingMessage` 失敗時に握りつぶしており、依頼主の「失敗は隠さない」「完全ログ主義」に反するリスクがある。

## 影響範囲
- execa を直接呼んでいる箇所: `runCoderabbitSubcommand`, `run_review`, `install_cli`, `auth_login`, `auth_status`。すべて `signal` オプションを使用。
- ToolContext.signal (AbortSignal) による中断が効かず、長時間処理をキャンセルできない。
- ログ転送失敗が可視化されないため、MCP クライアントでログが欠落しても原因追跡が困難。

## 一次情報確認
- execa v9.6.0 公式変更: `signal` オプションは `cancelSignal` に改名。`signal` を渡すと TypeError で即時失敗。`cancelSignal` では `AbortController` 由来のシグナルを渡す。 (DeepWiki: sindresorhus/execa)
- MCP TypeScript SDK: ToolContext から `signal` を受け取り、notifications/progress など任意の操作内で利用可能。 (Context7: /modelcontextprotocol/typescript-sdk)
- CodeRabbit CLI 公式インストーラ: `curl -fsSL https://cli.coderabbit.ai/install.sh | sh` を macOS/Linux で実行する想定。 (https://cli.coderabbit.ai/install.sh)

## 実装方針（o3MCP との合意）
1. **cancelSignal 対応**
   - 余計な抽象を避けつつ、まずは既存の execa 呼び出しすべてで `signal` → `cancelSignal` へ明示的に置換し、AbortSignal が確実に伝播する状態を作る。
   - 次フェーズで `runSubprocess` のような薄い共通ヘルパーを導入し、cancelSignal 配線と report:// 記録を 1 箇所に集約する。（Issue 登録済み）
2. **ログ転送失敗の顕在化**
   - server.ts の `registerLogTransmitter` で sendLoggingMessage 失敗時に ERROR を stderr 出力し、対象ログ/エラー内容を JSON として可視化する。
   - MCP 側に届けられなくても、少なくともローカル stderr と report:// で追跡可能にする拡張を今後検討する。（Issue 登録）
3. **ensure_cli / install_cli ログ強化**
   - 現行コードでは PATH や探索パスの詳細ログが残らないため、観測性が不足。PATH, 探索結果、失敗理由を JSON で report:// に保存する改善を次タスクとして扱う。

## 当面の作業項目
1. execa 呼び出しを `cancelSignal` API に更新。（run_review / install_cli / auth_* / runCoderabbitSubcommand）
2. server.ts のログ転送 catch を削除し、送信失敗を ERROR で直接通知。
3. 確認ログ＆手順をこのドキュメントに追記済み。
4. 追加改善（共通ヘルパー導入、ensure_cli 観測強化）を `_docs/issue.md` に登録。

## 今後の検証
- `ensure_cli` → `install_cli(confirm=true)` の通し実行で CLI が導入されること。
- `run_review` を進行中に ToolContext.signal で Abort → execa がキャンセルされ、MCP 側に ERROR が返ること。
- ログ転送失敗のシミュレーション（server.server.sendLoggingMessage を故意に throw）で stderr に ERROR が残ること。
