import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { emojiToUnicode } from "$lib/utils/emojiUtils.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { tick } = ctx.params;
      if (!tick) {
        throw new Error("Tick parameter is required");
      }

      // Decode and normalize the tick
      const decodedTick = decodeURIComponent(tick);
      const normalizedTick = emojiToUnicode(decodedTick);

      // Fetch mint progress data with normalized tick
      const mintStatus = await Src20Controller.handleSrc20MintProgressRequest(
        normalizedTick,
      );

      // Fetch holders count with normalized tick
      const balanceData = await Src20Controller.handleSrc20BalanceRequest({
        tick: normalizedTick,
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
