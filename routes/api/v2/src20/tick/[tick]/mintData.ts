import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { logger } from "$lib/utils/logger.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { tick } = ctx.params;
      if (!tick) {
        throw new Error("Tick parameter is required");
      }

      const normalizedTick = convertEmojiToTick(decodeURIComponent(tick));

      const [mintStatus, balanceData] = await Promise.all([
        Src20Controller.handleSrc20MintProgressRequest(normalizedTick),
        Src20Controller.handleSrc20BalanceRequest({
          tick: normalizedTick,
          includePagination: true,
          limit: 1,
          page: 1,
        }),
      ]);

      return new Response(
        JSON.stringify({
          mintStatus,
          holders: balanceData.total || 0,
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      logger.error("stamps", {
        message: "Error in /api/v2/src20/tick/[tick]/mintData",
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return new Response(
        JSON.stringify({ error: "Error fetching mint data" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
