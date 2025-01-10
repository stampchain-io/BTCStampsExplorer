import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$islands/src20/details/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/details/SRC20DetailsTab.tsx";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { HoldersGraph } from "$components/shared/HoldersGraph.tsx";
import { SRC20TickPageData } from "$lib/types/src20.d.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const rawTick = ctx.params.tick; // Could be "%F0%9F%9B%B8" or "\U0001F6F8"
      const decodedTick = rawTick; // Pass through raw emoji to database layer

      // Pass directly to controller - repository will handle format conversion
      const body = await Src20Controller.fetchSrc20TickPageData(decodedTick);
      if (!body) {
        return ctx.renderNotFound();
      }

      return await ctx.render(body);
    } catch (error) {
      console.error("Error in SRC20 tick page:", error);
      if ((error as Error).message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      });
    }
  },
};

interface SRC20TickPageProps {
  data: SRC20TickPageData | { error: string };
}

function SRC20TickPage(props: SRC20TickPageProps) {
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
  } = props.data;

  const tick = deployment.tick;

  return (
    <div class="flex flex-col gap-6">
      <SRC20TickHeader
        deployment={deployment}
        mintStatus={mint_status}
        totalMints={total_mints}
        totalTransfers={total_transfers}
        marketInfo={marketInfo}
      />
      <HoldersGraph holders={holders} />
      <SRC20DetailsTab tick={tick} />
    </div>
  );
}

export default SRC20TickPage;
