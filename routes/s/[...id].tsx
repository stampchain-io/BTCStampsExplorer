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
/* ===== STAMP CONTENT ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import {
  handleContentRequest,
  State,
} from "$routes/handlers/sharedContentHandler.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<unknown, State> = {
  GET(_req: Request, ctx) {
    const id = ctx.params.id.split("/").pop();
    if (!id) return ctx.renderNotFound();
    return handleContentRequest(id, ctx);
  },
};
