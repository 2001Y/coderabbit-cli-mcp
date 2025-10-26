export interface ToolExtra {
  requestId: string | number;
  sessionId?: string;
  signal: AbortSignal;
  _meta?: {
    progressToken?: string | number;
    [key: string]: unknown;
  };
  sendNotification: (notification: { jsonrpc: string; method: string; params: unknown }) => Promise<void>;
}
