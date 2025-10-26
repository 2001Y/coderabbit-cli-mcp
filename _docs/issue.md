# issue backlog

1. **WSL 設定ガイドの最適化**
   - Windows/WSL を自動検出し、`run_review` が返すセットアップガイドで WSL 固有の PATH 追記や `wsl.exe` 経由のブラウザ起動 Tips を含める。
2. **report:// 永続化**
   - LRU がプロセスメモリのみなので再起動時に履歴が消える。`~/.cache/coderabbit-cli-mcp` などへ暗号化せずに書き出すオプションを追加し、ログ完全性をさらに高めたい。
3. **CLI help との README 連動**
   - `cli_help` で抽出したフラグ一覧を README/ドキュメントに自動反映するスクリプトを追加し、「新フラグ検知 → ドキュメント更新」のパイプラインを自動化する。
4. **run_subprocess ヘルパー導入**
   - execa 呼び出しを 1 箇所に集約し、`cancelSignal` 配線、stdout/stderr の report:// 保存、開始/終了ログを自動化する。API 変更時に 1 ファイルの修正で済むようにし、AbortSignal の e2e テストも整備する。
5. **run_review ガイドの report:// 化**
   - インストール/認証ガイドを返した際に、その内容を `report://run_review/...` にも保存して再参照できるようにする。クライアントがエラーメッセージを取り逃しても履歴から追えるようにする。
