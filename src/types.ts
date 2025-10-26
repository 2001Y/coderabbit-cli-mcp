import type { RequestHandlerExtra } from '@modelcontextprotocol/sdk/dist/esm/shared/protocol';
import type { ServerRequest, ServerNotification } from '@modelcontextprotocol/sdk/dist/esm/types';

export type ToolContext = RequestHandlerExtra<ServerRequest, ServerNotification>;
