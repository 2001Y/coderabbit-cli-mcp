import type { RequestHandlerExtra } from "@modelcontextprotocol/sdk/dist/esm/shared/protocol.js";
import type { ServerNotification, ServerRequest } from "@modelcontextprotocol/sdk/dist/esm/types.js";

export type ToolExtra = RequestHandlerExtra<ServerRequest, ServerNotification>;
