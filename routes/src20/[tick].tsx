/* ===== SRC20 DETAIL PAGE ===== */
import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20DetailHeader } from "$header";
import { DataTableBase, HoldersTable } from "$table";
import ChartWidget from "$islands/layout/ChartWidget.tsx";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      /* ===== TOKEN IDENTIFICATION ===== */
      const rawTick = ctx.params.tick;
      const decodedTick = decodeURIComponent(rawTick);
      const encodedTick = encodeURIComponent(rawTick);

      // Get the base URL from the request
      const url = new URL(_req.url);
      const baseUrl = `${url.protocol}//${url.host}`;

      /* ===== DATA FETCHING ===== */
      const [body, transferCount, mintCount, combinedListings] = await Promise
        .all([
          Src20Controller.fetchSrc20TickPageData(decodedTick),
          fetch(
            `${baseUrl}/api/v2/src20/tick/${encodedTick}?op=TRANSFER&limit=1`,
          )
            .then((r) => r.json()),
          fetch(`${baseUrl}/api/v2/src20/tick/${encodedTick}?op=MINT&limit=1`)
            .then((r) => r.json()),
          fetch(
            `https://api.stampscan.xyz/utxo/combinedListings?tick=${encodedTick}`,
          ).then((r) => r.json()),
        ]);

      if (!body) {
        return ctx.renderNotFound();
      }
      /* @fullman */
      const highchartsData = combinedListings.map((item, _index) => [
        new Date(item.date).getTime(),
        item.unit_price_btc * 100000000, // Convert BTC to sats
      ]).sort((a, b) => a[0] - b[0]);

      /* ===== RESPONSE FORMATTING ===== */
      body.initialCounts = {
        transfers: transferCount.total || 0,
        mints: mintCount.total || 0,
      };
      body.highcharts = highchartsData || [];

      return await ctx.render(body);
    } catch (error) {
      console.error("Error in SRC20 detail page:", error);
      if ((error as Error).message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};

/* ===== TYPES ===== */
interface SRC20DetailPageProps {
  data: SRC20DetailPageData | { error: string };
}

/* ===== PAGE COMPONENT ===== */
function SRC20DetailPage(props: SRC20DetailPageProps) {
  /* ===== ERROR HANDLING ===== */
  if ("error" in props.data) {
    return (
      <div class="text-center text-red-500">
        {props.data.error}
      </div>
    );
  }

  const {
    deployment,
    holders,
    mint_status,
    total_mints,
    total_transfers,
    marketInfo,
    highcharts,
  } = props.data;

  const tick = deployment.tick;

  /* ===== TABLE CONFIGURATION ===== */
  const tableConfigs = [
    { id: "mints", label: "MINTS" },
    { id: "transfers", label: "TRANSFERS" },
  ];

  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col gap-6">
      <SRC20DetailHeader
        deployment={deployment}
        mintStatus={mint_status}
        totalMints={total_mints}
        totalTransfers={total_transfers}
        marketInfo={marketInfo}
      />
      <ChartWidget data={highcharts} />
      <HoldersTable holders={holders} />
      <DataTableBase
        type="src20"
        configs={tableConfigs}
        tick={tick}
      />
    </div>
  );
}
export default SRC20DetailPage;
