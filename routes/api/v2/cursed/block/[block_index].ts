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
import { handler as sharedBlockWithStampsHandler } from "$routes/handlers/sharedBlockWithStampsHandler.ts";

export const handler = sharedBlockWithStampsHandler;
