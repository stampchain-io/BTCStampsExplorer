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

      // Debug logging with structured logger
      logger.debug("stamps", {
        message: "Processing tick request",
        data: {
          originalTick: tick,
        }
      });

      const decodedTick = decodeURIComponent(tick);
      logger.debug("stamps", {
        message: "Decoded tick",
        data: {
          decodedTick,
        }
      });

      const normalizedTick = convertEmojiToTick(decodedTick);
      logger.debug("stamps", {
        message: "Normalized tick",
        data: {
          normalizedTick,
        }
      });

      // Fetch mint progress data with normalized tick
      const mintStatus = await Src20Controller.handleSrc20MintProgressRequest(
        normalizedTick,
      );
      logger.debug("stamps", {
        message: "Mint status retrieved",
        data: {
          mintStatus,
        }
      });

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
      logger.error("stamps", {
        message: "Error in /api/v2/src20/tick/[tick]/mint_data",
        data: {
          error: error instanceof Error ? error.message : String(error),
        }
      });

      return new Response(
        JSON.stringify({ error: "Error fetching mint data" }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }
  },
};
