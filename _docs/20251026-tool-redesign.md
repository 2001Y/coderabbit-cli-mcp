# Tool 設計リセットメモ (2025-10-26)

## 背景
- MCP サーバー上で CodeRabbit CLI のインストールやブラウザ認証を“自動実行”しようとしても、ヘッドレス環境や利用者の権限設定に阻まれ、実際にはユーザーが自分の端末で操作する必要がある。
- `install_cli` / `ensure_cli` ツールは curl + sh を直接叩く実装だったが、依頼主から「価値がない」「Codex 側で案内できれば十分」との指摘を受けた。
- したがってツールは「検出」と「案内」に専念し、実コマンドの実行はユーザーが自分の環境で行う方針に切り替える。

## 新方針（2025-10-26 改訂）
1. **run_review に一本化**
   - MCP サーバーが提供する実行ツールは `run_review` のみとし、その他の CLI 補助ツールは廃止する。
   - 追加の操作や情報提示は、すべて `run_review` のレスポンス／エラーメッセージ内で完結させる。
2. **run_review 内でのセットアップ誘導**
   - coderabbit バイナリ未検出時は `run_review` が OS 判定付きのインストール＆認証手順を含む ERROR を返す。
   - CLI 実行が exit code ≠ 0 だった場合も stdout/stderr を解析し、「未ログイン」「設定不足」など初回エラーに対する案内を組み込む。
   - すべての案内には「Codex は自力で解決を試みず、ユーザーへ状況報告して指示を仰ぐ」文言を必ず含める。
3. **ヘルパーは最小限**
   - ガイド文字列を生成する `buildInstallGuide()` と、env/TOML 設定を読み込む `config.ts` のみを残し、MCP Tool は `run_review.ts` だけに集約する。

## 実装メモ
- server の tool 登録から `ensure_cli` / `install_cli` / `auth_*` / `version` / `cli_help` / `write_config` / `doctor` を削除。
- `run_review` に以下の分岐を実装:
  - `resolveCoderabbitBinary` 失敗 → ガイド付き ERROR。
  - 実行 exit code ≠ 0 → stdout/stderr のキーワード（未ログイン/権限/不明）でガイドを出しつつ report:// URI を提示。
- README では `run_review` 単独構成と、エラー時の案内が同じツールで完結することを説明する。
- 追加の observability はログと `report://run_review/...` に集約する。
