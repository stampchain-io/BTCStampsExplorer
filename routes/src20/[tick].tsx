import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$islands/src20/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/SRC20DetailsTab.tsx";
import { convertEmojiToTick } from "utils/util.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { set_precision } from "bigfloat/mod.ts";
import { HoldersInfo } from "$components/HoldersInfo.tsx";
import { TransfersInfo } from "$components/TransfersInfo.tsx";

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
      // Optionally, you can pass an error message to the page
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
      <SRC20TickHeader
        deployment={deployment}
        mint_status={mint_status}
        total_holders={total_holders}
        total_mints={total_mints}
        total_transfers={total_transfers}
      />
      <div class="w-full flex flex-col md:flex-row gap-20 justify-center">
        <div class="w-full h-full bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6">
          <SRC20DetailsTab
            holders={holders}
            tick={tick} // Pass tick prop
          />
        </div>
      </div>
    </div>
  );
}

export default SRC20TickPage;
