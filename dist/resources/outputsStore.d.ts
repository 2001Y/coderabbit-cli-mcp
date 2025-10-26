import { type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
export declare function storeReport(input: {
    tool: string;
    title: string;
    body: string;
    mimeType?: string;
    durationMs?: number;
}): {
    uri: string;
    id: string;
};
export declare function registerResources(server: McpServer): void;
