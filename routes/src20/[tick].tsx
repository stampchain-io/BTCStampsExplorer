import { HandlerContext } from "$fresh/server.ts";
import TickInfo from "$components/src20/TickInfo.tsx";

import {
  CommonClass,
  connectDb,
  Src20Class,
} from "../../lib/database/index.ts";
import { BigFloat, set_precision } from "bigfloat/mod.ts";
import { paginate } from "utils/util.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      const { tick } = ctx.params;
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get("limit")) || 20;
      const page = Number(url.searchParams.get("page")) || 1;

      const client = await connectDb();
      const deployment = await Src20Class
        .get_valid_src20_deploy_by_tick_with_client(
          client,
          tick,
        );

      const mint_status = await Src20Class
        .get_src20_minting_progress_by_tick_with_client(
          client,
          tick,
        );
      const mints = await Src20Class
        .get_valid_src20_tx_by_tick_with_op_with_client(
          client,
          tick,
          "MINT",
          limit,
          page,
        );
      const sends = await Src20Class
        .get_valid_src20_tx_by_tick_with_op_with_client(
          client,
          tick,
          "SEND",
          limit,
          page,
        );
      const total_holders = await Src20Class
        .get_total_src20_holders_by_tick_with_client(
          client,
          tick,
          1,
        );
      const holders = await Src20Class.get_src20_holders_by_tick_with_client(
        client,
        tick,
        1,
        limit,
        page,
      );

      const last_block = await CommonClass.get_last_block_with_client(client);

      client.close();
      const body = {
        last_block: last_block.rows[0]["last_block"],
        deployment: deployment.rows.map((row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
        sends: sends.rows.map((row) => {
          return {
            ...row,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
        mints: mints.rows.map((row) => {
          return {
            ...row,
            amt: row.amt ? row.amt.toString() : null,
          };
        }),
        total_holders: total_holders.rows[0]["total"],
        holders: holders.rows.map((row) => {
          const percentage = new BigFloat(row.amt).mul(100).div(
            mint_status.total_minted,
          );
          const amt = new BigFloat(row.amt);
          set_precision(-2);
          return {
            ...row,
            amt: amt.toString(),
            percentage: parseFloat(percentage.toString()).toFixed(2),
          };
        }),
        mint_status: {
          ...mint_status,
          max_supply: mint_status.max_supply.toString(),
          total_minted: mint_status.total_minted.toString(),
          limit: mint_status.limit.toString(),
        },
      };
      return await ctx.render(body);
    } catch (error) {
      console.error(error);
      const body = { error: `Error: Internal server error` };
      return ctx.render(body);
    }
  },
};

export const SRC20TickPage = (props) => {
  const {
    deployment,
    sends,
    mints,
    total_holders,
    holders,
    mint_status,
    last_block,
  } = props.data;

  return (
    <div class="text-white">
      <TickInfo
        deployment={deployment}
        mint_status={mint_status}
        total_holders={total_holders}
      />
    </div>
  );
};

export default SRC20TickPage;
