import { StampRow } from "globals";

import { Handlers } from "$fresh/server.ts";

import { Stamp } from "$components/Stamp.tsx";

import { StampShare } from "$components/stampDetails/StampShare.tsx";
import { StampVaulted } from "$components/stampDetails/StampVaulted.tsx";
import { StampInfo } from "$components/stampDetails/StampInfo.tsx";
import { StampSends } from "$components/stampDetails/StampSends.tsx";
import { StampHolders } from "$components/stampDetails/StampHolders.tsx";
import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampController } from "$lib/controller/stampController.ts";

interface StampDetailPageProps {
  data: {
    stamp: StampRow;
    total: number;
    sends: any;
    dispensers: any;
    dispenses: any;
    holders: any;
    last_block: number;
  };
}

interface StampData {
  stamp: StampRow;
  total: number;
  sends: any;
  dispensers: any;
  dispenses: any;
  holders: any;
  last_block: number;
}

export const handler: Handlers<StampData> = {
  async GET(_req: Request, ctx) {
    try {
      const { id } = ctx.params;
      const stampData = await StampController.getStampDetailsById(id);

      if (!stampData) {
        return new Response("Stamp not found", { status: 404 });
      }
      // TODO: Get holders for src-20 tokens
      return ctx.render({
        ...stampData.data,
        last_block: stampData.last_block,
      }); // Spread the stampData to avoid the extra nesting
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function StampPage(props: StampDetailPageProps) {
  const { stamp, holders, sends, dispensers, dispenses, total, last_block } =
    props.data;
  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        <div class="flex flex-col gap-8 justify-between">
          <Stamp stamp={stamp} className="w-full" />
          <StampShare stamp={stamp} />
          <StampVaulted />
        </div>

        <StampInfo stamp={stamp} />
      </div>

      <StampSends sends={sends} />
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        <StampDispensers holders={holders} />
        <StampHolders holders={holders} />
      </div>
      <StampSales />
      {/* <HoldersInfo /> */}
    </>
  );
}
