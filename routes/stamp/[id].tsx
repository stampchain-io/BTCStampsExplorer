import { HolderRow, SendRow, StampRow } from "globals";

import { FreshContext, Handlers } from "$fresh/server.ts";

import { api_get_stamp_all_data } from "$lib/controller/stamp.ts";
import { get_suffix_from_mimetype, short_address } from "$lib/utils/util.ts";

import { Stamp } from "$components/Stamp.tsx";
import { HoldersInfo } from "$components/HoldersInfo.tsx";

import { StampShare } from "$components/stampDetails/StampShare.tsx";
import { StampVaulted } from "$components/stampDetails/StampVaulted.tsx";
import { StampInfo } from "../../components/stampDetails/StampInfo.tsx";
import { StampSends } from "$components/stampDetails/StampSends.tsx";
import { StampHolders } from "$components/stampDetails/StampHolders.tsx";
import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";

type StampPageProps = {
  data: {
    stamp: StampRow;
    total: number;
    sends: any;
    holders: any;
  };
};

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: FreshContext) {
    const { id } = ctx.params;
    const res = await api_get_stamp_all_data(id);
    if (!res) {
      return ctx.renderNotFound();
    }
    const { stamp, holders, total, sends } = res;
    const data = {
      stamp,
      holders,
      sends,
      total,
    };
    return await ctx.render(data);
  },
};

export default function StampPage(props: StampPageProps) {
  const { stamp, sends, holders, total } = props.data;

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
