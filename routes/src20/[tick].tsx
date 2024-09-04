import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$components/src20/SRC20TickHeader.tsx";
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
      return ctx.renderNotFound();
    }
  },
};

export const SRC20TickPage = (props) => {
  const {
    deployment,
    transfers,
    mints,
    total_holders,
    holders,
    mint_status,
    total_mints,
    last_block,
    total_transfers,
  } = props.data;

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
        <div class="w-full md:w-2/5 h-full">
          <SRC20DetailsTab
            holders={holders}
            transfers={transfers}
            mints={mints}
          />
        </div>
        <div class="relative w-full md:w-3/5 flex justify-center">
          <HoldersInfo holders={holders} />
          {/* <TransfersInfo transfers={transfers} /> */}
        </div>
      </div>
    </div>
  );
};

export default SRC20TickPage;
