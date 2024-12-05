import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$islands/src20/details/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/details/SRC20DetailsTab.tsx";
import { convertEmojiToTick } from "$lib/utils/emojiUtils.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { set_precision } from "bigfloat/mod.ts";
import { MarketListingSummary } from "$types/index.d.ts";
import { HoldersGraph } from "$components/shared/HoldersGraph.tsx";

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      let { tick } = ctx.params;
      if (!tick) {
        return ctx.renderNotFound();
      }

      tick = convertEmojiToTick(tick);
      set_precision(-4);
      const body = await Src20Controller.handleTickPageRequest(tick);

      if (!body || body.error) {
        return ctx.renderNotFound();
      }

      return await ctx.render(body);
    } catch (error) {
      console.error("Error in SRC20 tick page:", error);
      if ((error as Error).message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return ResponseUtil.internalError(
        error,
        "Internal Server Error",
      );
    }
  },
};

interface SRC20TickPageProps {
  data: {
    deployment: any;
    total_holders: number;
    holders: any[];
    mint_status: any;
    total_mints: number;
    total_transfers: number;
    error?: string;
    marketInfo?: MarketListingSummary; // Updated type
  };
}

function SRC20TickPage(props: SRC20TickPageProps) {
  const {
    deployment,
    total_holders,
    holders,
    mint_status,
    total_mints,
    total_transfers,
    error,
    marketInfo,
  } = props.data;

  if (error) {
    return (
      <div class="text-center text-red-500">
        {error}
      </div>
    );
  }

  const tick = deployment.tick;

  return (
    <div class="flex flex-col gap-6">
      <SRC20TickHeader
        deployment={deployment}
        mintStatus={mint_status}
        totalMints={total_mints}
        totalTransfers={total_transfers}
        marketInfo={marketInfo} // Now contains data for current tick
      />
      <HoldersGraph holders={holders} />
      <SRC20DetailsTab tick={tick} />
    </div>
  );
}

export default SRC20TickPage;
