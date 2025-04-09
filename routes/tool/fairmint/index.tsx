/* ===== FAIRMINT TOOL PAGE ===== */
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { FairmintTool } from "$islands/tool/fairmint/FairmintTool.tsx";

/* ===== TYPES ===== */
interface ToolFairmintPageProps {
  fairminters: any[];
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<ToolFairmintPageProps> = {
  async GET(_req, ctx) {
    try {
      const fairminters = await XcpManager.getFairminters();
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
