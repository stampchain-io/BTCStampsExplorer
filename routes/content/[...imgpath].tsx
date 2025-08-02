import type { SUBPROTOCOLS } from "$types/base.d.ts";
import type {
  ColumnDefinition,
  FeeAlert,
  InputData,
  MockResponse,
  NamespaceImport,
  ProtocolComplianceLevel,
  ToolEstimationParams,
  XcpBalance,
} from "$types/toolEndpointAdapter.ts";
/* ===== CONTENT IMAGE ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import {
  handleContentRequest,
  State,
} from "$routes/handlers/sharedContentHandler.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<any, State> = {
  GET(_req: Request, ctx) {
    return handleContentRequest(ctx.params.imgpath, ctx);
  },
};
