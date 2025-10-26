import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { GetPromptResult } from '@modelcontextprotocol/sdk/dist/esm/types';

export function registerPrompts(server: McpServer) {
  const prompts = [
    {
      name: 'review_local_uncommitted',
      description: 'Run CodeRabbit review on uncommitted changes with plain output.',
      payload: JSON.stringify({ tool: 'run_review', arguments: { mode: 'plain', type: 'uncommitted' } }, null, 2)
    },
    {
      name: 'review_all_plain',
      description: 'Review entire repository with default plain output.',
      payload: JSON.stringify({ tool: 'run_review', arguments: { mode: 'plain', type: 'all' } }, null, 2)
    },
    {
      name: 'prompt_only_uncommitted',
      description: 'Minimal prompt-only run against uncommitted diff for LLM agents.',
      payload: JSON.stringify({ tool: 'run_review', arguments: { mode: 'prompt-only', type: 'uncommitted' } }, null, 2)
    }
  ];

  for (const prompt of prompts) {
    server.prompt(
      prompt.name,
      prompt.description,
      async () => ({
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Invoke the run_review tool with the following JSON arguments:'
              },
              {
                type: 'text',
                text: prompt.payload
              }
            ]
          }
        ]
      } as GetPromptResult)
    );
  }
}
