import { api_get_stamp } from "$lib/controller/stamp.ts";
import { get_suffix_from_mimetype, short_address } from "$lib/utils/util.ts";

import { StampInfo } from "$components/StampInfo.tsx";
import { HoldersInfo } from "$components/HoldersInfo.tsx";
import { StampHistory } from "$components/StampHistory.tsx";
import { Stamp } from "$components/Stamp.tsx";
import { HolderRow, SendRow, StampRow } from "globals";
import { FreshContext, Handlers } from "$fresh/server.ts";

type StampPageProps = {
  // data: { stamp: any; sends: any; holders: any; total: any };
  params: {
    stamp: StampRow;
    total: number;
    // data: string;
  };
};
type StampHistoryProps = {
  holders: HolderRow[];
  sends: SendRow[];
  className?: string;
};

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: FreshContext) {
    const { id } = ctx.params;
    const res = await api_get_stamp(id);
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
  console.log("holders:", holders);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 p-4">
      <div className="flex flex-col items-center justify-center order-1 sm:order-1">
        <Stamp stamp={stamp} className="w-full" />
      </div>

      <div className="order-3 sm:order-2 text-gray-200">
        <StampHistory holders={holders} sends={sends} className="w-full" />
      </div>

      <div className="order-2 sm:order-3">
        <StampInfo stamp={stamp} className="w-full" />
      </div>

      {
        /* <div className="order-4 sm:order-4">
        <HoldersInfo />
      </div> */
      }
    </div>
  );
}
