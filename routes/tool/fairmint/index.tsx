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
/* ===== FAIRMINT TOOL PAGE ===== */
import { Handlers, PageProps } from "$fresh/server.ts";
import type { ToolFairmintPageProps } from "$types/ui.d.ts";
import { Head } from "$fresh/runtime.ts";
import { CounterpartyApiManager } from "$server/services/counterpartyApiService.ts";
import { FairmintTool } from "$tool";

/* ===== TYPES ===== */

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<ToolFairmintPageProps> = {
  async GET(_req, ctx) {
    try {
      const fairminters = await CounterpartyApiManager.getFairminters();
      return ctx.render({ fairminters });
    } catch (error) {
      console.error("Error fetching fairminters:", error);
      return ctx.render({ fairminters: [] });
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function ToolFairmintPage(
  { data }: PageProps<ToolFairmintPageProps>,
) {
  /* ===== RENDER ===== */
  return (
    <>
      <Head>
        <title>Fairmint Tokens</title>
      </Head>
      <FairmintTool fairminters={data.fairminters} />
    </>
  );
}
