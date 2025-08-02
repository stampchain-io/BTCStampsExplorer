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
import { Handlers } from "$fresh/server.ts";
import { CounterpartyApiManager } from "$server/services/counterpartyApiService.ts";
import { ResponseUtil } from "$lib/utils/api/responses/responseUtil.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    try {
      const fairminters = await CounterpartyApiManager.getFairminters();
      return ResponseUtil.success(fairminters);
    } catch (error) {
      console.error("Error fetching fairminters:", error);
      return ResponseUtil.internalError(error, "Failed to fetch fairminters");
    }
  },
};
