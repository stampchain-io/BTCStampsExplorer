import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$islands/src20/details/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/details/SRC20DetailsTab.tsx";
import { convertEmojiToTick } from "utils/util.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { set_precision } from "bigfloat/mod.ts";
import { SRC20HoldersInfo } from "$components/src20/SRC20HoldersInfo.tsx";

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      let { tick } = ctx.params;
      tick = convertEmojiToTick(tick);
      set_precision(-4);
      const body = await Src20Controller.handleTickPageRequest(tick);
      return await ctx.render(body);
    } catch (error) {
      console.error(error);
      return ctx.render({ error: error.message });
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
    // Add error property if needed
    error?: string;
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
    error, // Extract error message if present
  } = props.data;

  if (error) {
    return (
      <div class="text-center text-red-500">
        {error}
      </div>
    );
  }

  // Continue with existing component rendering
  const tick = deployment.tick;

  return (
    <div class="flex flex-col gap-8">
      <div className="flex flex-col lg:flex-row gap-8">
        <SRC20TickHeader
          deployment={deployment}
          mintStatus={mint_status}
          totalHolders={total_holders}
          totalMints={total_mints}
          totalTransfers={total_transfers}
        />
        <SRC20HoldersInfo holders={holders} />
      </div>
      <SRC20DetailsTab tick={tick} />
    </div>
  );
}

export default SRC20TickPage;
