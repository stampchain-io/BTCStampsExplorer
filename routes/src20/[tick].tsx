import { HandlerContext } from "$fresh/server.ts";
import { SRC20TickHeader } from "$components/src20/SRC20TickHeader.tsx";
import { SRC20Header } from "$islands/src20/SRC20Header.tsx";
import { SRC20DetailsTab } from "$islands/src20/SRC20DetailsTab.tsx";

import {
  CommonClass,
  getClient,
  Src20Class,
} from "../../lib/database/index.ts";
import { BigFloat, set_precision } from "bigfloat/mod.ts";
import { convertEmojiToTick } from "utils/util.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      let { tick } = ctx.params;
      tick = convertEmojiToTick(tick);
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get("limit")) || 200;
      const page = Number(url.searchParams.get("page")) || 1;

      const client = await getClient();
      const deployment = await Src20Class
        .get_valid_src20_tx_with_client(
          client,
          null,
          [tick],
          "DEPLOY",
        );

      const mint_status = await Src20Class
        .get_src20_minting_progress_by_tick_with_client_new(
          client,
          tick,
        );
      const mints = await Src20Class
        .get_valid_src20_tx_with_client(
          client,
          null,
          tick,
          "MINT",
          limit,
          page,
          "DESC",
        );
      const sends = await Src20Class
        .get_valid_src20_tx_with_client(
          client,
          null,
          tick,
          "TRANSFER",
          limit,
          page,
          "DESC",
        );
      const total_holders = await Src20Class
        .get_total_src20_holders_by_tick_with_client(
          client,
          tick,
          1,
        );
      const holders = await Src20Class.get_src20_balance_with_client(
        client,
        null,
        tick,
        0,
        limit,
        page,
      );

      const total_sends = await Src20Class
        .get_total_valid_src20_tx_with_client(
          client,
          tick,
          "TRANSFER",
        );
      const total_mints = await Src20Class
        .get_total_valid_src20_tx_with_client(
          client,
          tick,
          "MINT",
        );

      const last_block = await CommonClass.get_last_block_with_client(client);

      set_precision(-4);
      const body = {
        last_block: last_block.rows[0]["last_block"],
        deployment: deployment.rows.map((row) => {
          return {
            ...row,
            max: row.max ? row.max.toString() : null,
            lim: row.lim ? row.lim.toString() : null,
            amt: row.amt ? row.amt.toString() : null,
          };
        })[0],
        sends: sends.rows.map((row) => {
          return {
            ...row,
            amt: row.amt ? new BigFloat(row.amt).toString() : null,
          };
        }),
        total_sends: total_sends.rows[0]["total"],
        mints: mints.rows.map((row) => {
          return {
            ...row,
            amt: row.amt ? new BigFloat(row.amt).toString() : null,
          };
        }),
        total_mints: total_mints.rows[0]["total"],
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
      return ctx.renderNotFound();
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
    total_mints,
    last_block,
    total_sends,
  } = props.data;
  console.log({ deployment });

  return (
    <div class="flex flex-col gap-8">
      <SRC20Header />
      <SRC20TickHeader
        deployment={deployment}
        mint_status={mint_status}
        total_holders={total_holders}
        total_mints={total_mints}
        total_sends={total_sends}
      />
      <div class="w-full flex flex-col md:flex-row gap-4 items-center justify-center">
        <div class="w-full md:w-2/5 h-full">
          <SRC20DetailsTab holders={holders} sends={sends} mints={mints} />
        </div>
        <div class="relative w-full md:w-3/5">
        </div>
      </div>
    </div>
  );
};

export default SRC20TickPage;
