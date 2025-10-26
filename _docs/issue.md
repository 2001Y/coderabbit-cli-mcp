# issue backlog

1. **WSL 検出・自動手順**
   - 現状 `install_cli` は Windows 環境に対して WSL を案内するのみ。`/proc/version` から WSL 実行中かを判別し、WSL 内であれば Linux と同じパスで自動インストールができるようにする。
2. **report:// 永続化**
   - LRU がプロセスメモリのみなので再起動時に履歴が消える。`~/.cache/coderabbitai-cli-mcp` などへ暗号化せずに書き出すオプションを追加し、ログ完全性をさらに高めたい。
3. **CLI help との README 連動**
   - `cli_help` で抽出したフラグ一覧を README/ドキュメントに自動反映するスクリプトを追加し、「新フラグ検知 → ドキュメント更新」のパイプラインを自動化する。
