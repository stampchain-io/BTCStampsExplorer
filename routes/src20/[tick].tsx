import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$components/src20/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/SRC20DetailsTab.tsx";
import { convertEmojiToTick } from "utils/util.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { BigFloat, set_precision } from "bigfloat/mod.ts";
import { SRC20Repository } from "$lib/database/src20Repository.ts";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      let { tick } = ctx.params;
      tick = convertEmojiToTick(tick);
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get("limit")) || 200;
      const page = Number(url.searchParams.get("page")) || 1;

      const balanceParams = {
        tick,
        limit: 100000, // FIXME: need to return all rows by default and move to controller
        sort: "DESC",
      };

      const [balanceResponse, mintProgressResponse] = await Promise.all([
        SRC20Repository.getValidSrc20TxFromDb(balanceParams), // FIXME: this is only returning 200 rose
        // Src20Controller.handleSrc20BalanceRequest(balanceParams),
        Src20Controller.handleSrc20MintProgressRequest(tick),
      ]);

      if (!balanceResponse || !mintProgressResponse) {
        throw new Error("Failed to fetch SRC20 data");
      }

      const balanceData = await balanceResponse.rows;
      const mintProgressData = await mintProgressResponse.json();

      console.log("Balance Data:", balanceData);
      console.log("Mint Progress Data:", mintProgressData);

      set_precision(-4);
      const body = {
        last_block: balanceData[0]?.block_index, // Use optional chaining
        deployment: balanceData.find((item) => item.op === "DEPLOY"),
        sends: balanceData.filter((item) => item.op === "TRANSFER"),
        total_sends: balanceData.filter((item) =>
          item.op === "TRANSFER"
        ).length,
        mints: balanceData.filter((item) => item.op === "MINT"),
        total_mints: balanceData.filter((item) => item.op === "MINT").length,
        total_holders: balanceData.length,
        holders: balanceData.map((row) => {
          const amt = new BigFloat(row.amt || "0"); // Handle potential null/undefined
          const percentage = amt.mul(100).div(
            new BigFloat(mintProgressData.total_minted || "1"), // Avoid division by zero
          );
          set_precision(-2);
          return {
            ...row,
            amt: amt.toString(),
            percentage: parseFloat(percentage.toString()).toFixed(2),
          };
        }),
        mint_status: {
          ...mintProgressData,
          max_supply: mintProgressData.max_supply?.toString() || "0",
          total_minted: mintProgressData.total_minted?.toString() || "0",
          limit: mintProgressData.limit?.toString() || "0",
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
      {/* <SRC20Header /> */}
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
