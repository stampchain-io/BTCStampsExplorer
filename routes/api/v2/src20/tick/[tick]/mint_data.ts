import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { tick } = ctx.params;

    try {
      // Fetch mint progress data
      const mintStatus = await Src20Controller.handleSrc20MintProgressRequest(
        tick,
      );

      // Fetch holders count
      const balanceData = await Src20Controller.handleSrc20BalanceRequest({
        tick,
        includePagination: true,
        limit: 1,
        page: 1,
      });
      const holders = balanceData.total || 0;

      return new Response(
        JSON.stringify({
          mintStatus,
          holders,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error in /api/v2/src20/tick/[tick]/mint_data:", error);
      return new Response(
        JSON.stringify({ error: "Error fetching mint data" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
