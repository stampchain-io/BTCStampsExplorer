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
/* ===== TRADE PAGE ===== */
import { PageProps } from "$fresh/server.ts";
import { StampTradeTool } from "$tool";

/* ===== PAGE COMPONENT ===== */
export default function ToolTradePage(_props: PageProps) {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col items-center">
      <StampTradeTool />
    </div>
  );
}
