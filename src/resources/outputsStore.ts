import { randomUUID } from "node:crypto";
import { LRUCache } from "lru-cache";
import { ResourceTemplate, type McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

interface StoredOutput {
  uri: string;
  text: string;
  createdAt: string;
  tool: string;
  requestId: string;
  summary?: string;
}

const store = new LRUCache<string, StoredOutput>({ max: 20 });

export function saveOutput(params: { text: string; tool: string; requestId: string; summary?: string }) {
  const id = randomUUID();
  const uri = `report://${id}`;
  store.set(id, {
    uri,
    text: params.text,
    createdAt: new Date().toISOString(),
    tool: params.tool,
    requestId: params.requestId,
    summary: params.summary,
  });
  return uri;
}

export function registerResources(server: McpServer) {
  const template = new ResourceTemplate("report://{id}", {
    list: async () => ({
      resources: Array.from(store.entries()).map(([, value]) => ({
        uri: value.uri,
        name: value.summary ?? `${value.tool} output`,
        description: `createdAt=${value.createdAt}`,
      })),
    }),
    complete: {
      id: async (value: string) => Array.from(store.keys()).filter((key) => key.startsWith(value)),
    },
  });

  server.registerResource(
    "coderabbit-report",
    template,
    {
      title: "Recent CodeRabbit outputs",
      description: "LRU cache of the latest CodeRabbit CLI executions.",
    },
    async (uri, variables) => {
      const lookupId = (variables.id as string | undefined) ?? uri.host ?? uri.pathname.replace(/\//g, "");
      const entry = lookupId ? store.get(lookupId) : undefined;
      if (!entry) throw new Error(`report not found for ${uri.href}`);

      return {
        contents: [
          {
            uri: entry.uri,
            mimeType: "text/plain",
            text: entry.text,
            _meta: {
              createdAt: entry.createdAt,
              tool: entry.tool,
              requestId: entry.requestId,
            },
          },
        ],
      };
    },
  );
}
