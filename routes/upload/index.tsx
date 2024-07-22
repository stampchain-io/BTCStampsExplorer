import { HandlerContext } from "$fresh/server.ts";

import { getClient, Src20Class } from "$lib/database/index.ts";
import { useEffect, useState } from "preact/hooks";
import { paginate } from "utils/util.ts";
import { initialWallet, walletContext } from "store/wallet/wallet.ts";
import { UploadImageTable } from "$islands/upload/UploadImageTable.tsx";
import { BlockService } from "$lib/services/blockService.ts";
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const { wallet, isConnected } = walletContext;
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
      const lastBlock = await BlockService.getLastBlock();

      const pagination = paginate(total.rows[0]["total"], page, limit);

      const body = {
        ...pagination,
        last_block: lastBlock.last_block,
        data: data.rows.map((row) => {
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
    <>
      <div className={"self-center"}>
        <p class="text-white text-7xl leading-normal">SRC20 Stamp Upload</p>
      </div>
      <UploadImageTable data={data} />
    </>
  );
}
export default UploadBackground;
