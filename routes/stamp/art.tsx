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
/* ===== ART REDIRECT ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    url.pathname = "/stamp";
    url.searchParams.set("type", "classic");

    return WebResponseUtil.redirect(url.toString(), 307);
  },
};

/* ===== PAGE COMPONENT ===== */
export default function ArtRedirect() {
  /* ===== RENDER ===== */
  return null;
}
