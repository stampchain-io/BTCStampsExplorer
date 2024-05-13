import { HandlerContext } from "$fresh/server.ts";

import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { useState } from "preact/hooks";
import { paginate } from "utils/util.ts";
import { UploadForm } from "../../islands/UploadForm.tsx";
import { walletContext } from "store/wallet/wallet.ts";
import { UploadImageTable } from "$islands/upload/UploadImageTable.tsx";

//TODO: Add pagination

const { wallet, isConnected } = walletContext;

export const handler = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get("limit")) || 1000;
      const page = Number(url.searchParams.get("page")) || 1;

      const client = await getClient();
      const data = await Src20Class.get_valid_src20_tx_with_client(
        client,
        null,
        null,
        "DEPLOY",
        limit,
        page,
      );
      const total = await Src20Class.get_total_valid_src20_tx_with_client(
        client,
        null,
        "DEPLOY",
      );
      const last_block = await CommonClass.get_last_block_with_client(client);

      const pagination = paginate(total.rows[0]["total"], page, limit);

      const tmpData = isConnected.value
        ? data.rows
        : data.rows.filter((row) =>
          row.creator === "bc1qqz5tvzm3uw3w4lruga8aylsk9fs93y0w8fysfe"
        );

      const body = {
        ...pagination,
        last_block: last_block.rows[0]["last_block"],
        data: tmpData.map((row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
      };
      return await ctx.render(body);
    } catch (error) {
      console.error(error);
      const body = { error: `Error: Internal server error` };
      return ctx.render(body);
    }
  },
};

export function UploadBackground(props) {
  const { data, total, page, pages, limit } = props.data;
  return (
    <div className={"self-center"}>
      <div class={"text-yellow-600 text-[26px] font-bold"}>
        Upload Background Image
      </div>
      {isConnected.value ? <div></div> : <UploadImageTable data={data} />}
    </div>
  );
}
export default UploadBackground;
