import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const baseArgs = {
  notes: z.string().optional().describe("追加で共有したい context"),
};

const buildMessage = (preset: string, notes?: string) =>
  `run_review を ${preset} で実行してください.${notes ? `\n補足: ${notes}` : ""}`;

export function registerPrompts(server: McpServer) {
  server.registerPrompt(
    "review-local",
    {
      title: "ローカル差分レビュー (plain/uncommitted)",
      description: "plain モード + 未コミット差分",
      argsSchema: baseArgs,
    },
    ({ notes }) => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: buildMessage("mode=plain, type=uncommitted", notes) },
        },
      ],
    }),
  );

  server.registerPrompt(
    "review-all",
    {
      title: "全差分レビュー (plain/all)",
      description: "コミット済みを含む全差分",
      argsSchema: baseArgs,
    },
    ({ notes }) => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: buildMessage("mode=plain, type=all", notes) },
        },
      ],
    }),
  );

  server.registerPrompt(
    "prompt-only-uncommitted",
    {
      title: "LLM 連携用最小出力",
      description: "--prompt-only + 未コミット差分",
      argsSchema: baseArgs,
    },
    ({ notes }) => ({
      messages: [
        {
          role: "user",
          content: { type: "text", text: buildMessage("mode=prompt-only, type=uncommitted", notes) },
        },
      ],
    }),
  );
}
