import { StampRow } from "globals";

import { Handlers } from "$fresh/server.ts";

import { Stamp } from "$components/Stamp.tsx";

import { StampShare } from "$components/stampDetails/StampShare.tsx";
import { StampVaulted } from "$components/stampDetails/StampVaulted.tsx";
import { StampInfo } from "../../components/stampDetails/StampInfo.tsx";
import { StampSends } from "$components/stampDetails/StampSends.tsx";
import { StampHolders } from "$components/stampDetails/StampHolders.tsx";
import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampController } from "$lib/controller/stampController.ts";
import { IdHandlerContext } from "globals";

type StampPageProps = {
  data: {
    stamp: StampRow;
    total: number;
    sends: any;
    holders: any;
  };
};

export const handler = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  try {
    const { id } = ctx.params;
    const stampData = await StampController.getStampDetailsById(id);
    if (!stampData) {
      return new Response("Stamp not found", { status: 404 });
    }
    return ctx.render(stampData);
  } catch (error) {
    console.error("Error fetching stamp data:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};

export default function StampPage(props: StampPageProps) {
  const { stamp, sends, holders, _total } = props.data;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-12">
        <div class="flex flex-col gap-8 justify-between">
          <Stamp stamp={stamp} className="w-full" />
          <StampShare />
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
