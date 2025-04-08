/* ===== FAIRMINT TOOL PAGE ===== */
import { Handlers, PageProps } from "$fresh/server.ts";
import { Head } from "$fresh/runtime.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { FairmintContent } from "$islands/tool/fairmint/FairmintContent.tsx";

/* ===== TYPES ===== */
interface ToolsFairmintPageProps {
  fairminters: any[];
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<ToolsFairmintPageProps> = {
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
export default function ToolsFairmintPage(
  { data }: PageProps<ToolsFairmintPageProps>,
) {
  /* ===== RENDER ===== */
  return (
    <>
      <Head>
        <title>Fairmint Tokens</title>
      </Head>
      <FairmintContent fairminters={data.fairminters} />
    </>
  );
}
