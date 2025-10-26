import { ResourceTemplate, type McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import type { ReadResourceResult, Resource } from '@modelcontextprotocol/sdk/dist/esm/types';
import { LRUCache } from 'lru-cache';
import { randomUUID } from 'node:crypto';
import { createLogger } from '../logger.js';

const log = createLogger('resources.outputs');

interface ReportRecord {
  id: string;
  tool: string;
  title: string;
  body: string;
  mimeType?: string;
  createdAt: string;
  durationMs?: number;
  bytes: number;
}

const store = new LRUCache<string, ReportRecord>({
  max: 100,
  ttl: 1000 * 60 * 60 * 6
});

let notifyListChanged: (() => void) | undefined;

function toUri(record: ReportRecord): string {
  return `report://${record.tool}/${record.id}`;
}

function parseUri(uri: URL): { tool: string; id: string } {
  const tool = uri.host;
  const id = uri.pathname.replace(/^\//, '');
  if (!tool || !id) {
    throw new Error('invalid report URI');
  }
  return { tool, id };
}

export function storeReport(input: {
  tool: string;
  title: string;
  body: string;
  mimeType?: string;
  durationMs?: number;
}): { uri: string; id: string } {
  const now = new Date();
  const safeTs = now.toISOString().replace(/[-:]/g, '').replace(/\..+/, '');
  const id = `${safeTs}-${randomUUID().slice(0, 8)}`;
  const record: ReportRecord = {
    id,
    tool: input.tool,
    title: input.title,
    body: input.body,
    mimeType: input.mimeType,
    createdAt: now.toISOString(),
    durationMs: input.durationMs,
    bytes: Buffer.byteLength(input.body, 'utf8')
  };
  store.set(`${record.tool}:${record.id}`, record);
  notifyListChanged?.();
  return { uri: toUri(record), id: record.id };
}

export function registerResources(server: McpServer) {
  notifyListChanged = () => server.sendResourceListChanged();

  const template = new ResourceTemplate('report://{tool}/{id}', {
    list: async () => ({
      resources: Array.from<ReportRecord>(store.values()).map((record) => toResource(record))
    })
  });

  server.resource(
    'coderabbit-reports',
    template,
    {
      name: 'CodeRabbit CLI reports',
      description: 'Latest CodeRabbit CLI stdout/stderr captures.',
      mimeType: 'text/plain'
    },
    async (uri, _variables, _extra): Promise<ReadResourceResult> => {
      const { tool, id } = parseUri(uri);
      const record = store.get(`${tool}:${id}`);
      if (!record) {
        throw new Error(`report not found for ${uri.href}`);
      }
      await log.debug('resource read', { tool: record.tool, id: record.id });
      return {
        contents: [
          {
            type: 'text',
            text: record.body,
            mimeType: record.mimeType ?? 'text/plain'
          }
        ]
      };
    }
  );
}

function toResource(record: ReportRecord): Resource {
  return {
    uri: toUri(record),
    name: `${record.tool} ${record.id}`,
    description: record.title,
    mimeType: record.mimeType ?? 'text/plain',
    created: record.createdAt
  } as Resource;
}
