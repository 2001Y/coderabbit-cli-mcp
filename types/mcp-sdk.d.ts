declare module '@modelcontextprotocol/sdk/dist/esm/types' {
  export type CallToolResult = any;
  export type GetPromptResult = any;
  export type Resource = any;
  export type ReadResourceResult = any;
  export type ServerRequest = any;
  export type ServerNotification = any;
}

declare module '@modelcontextprotocol/sdk/dist/esm/shared/protocol' {
  export type RequestHandlerExtra<_Req = any, _Notif = any> = {
    signal: AbortSignal;
    sendNotification: (notification: _Notif) => Promise<void>;
    requestId?: string | number;
    _meta?: Record<string, unknown>;
  };
}
