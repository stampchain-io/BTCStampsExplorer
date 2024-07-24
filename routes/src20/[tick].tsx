import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$components/src20/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/SRC20DetailsTab.tsx";
import { convertEmojiToTick } from "utils/util.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { BigFloat, set_precision } from "bigfloat/mod.ts";

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      let { tick } = ctx.params;
      tick = convertEmojiToTick(tick);
      const url = new URL(req.url);
      const limit = Number(url.searchParams.get("limit")) || 200;
      const page = Number(url.searchParams.get("page")) || 1;

      const [balanceResponse, mintProgressResponse] = await Promise.all([
        Src20Controller.handleSrc20BalanceRequest({
          tick,
          limit,
          page,
          sort: "DESC",
        }),
        Src20Controller.handleSrc20MintProgressRequest(tick),
      ]);

      if (!balanceResponse.ok || !mintProgressResponse.ok) {
        throw new Error("Failed to fetch SRC20 data");
      }

      const { data: balanceData } = await balanceResponse.json();
      const { data: mintProgressData } = await mintProgressResponse.json();

      set_precision(-4);
      const body = {
        last_block: balanceResponse.last_block,
        deployment: balanceData.find((item) => item.op === "DEPLOY"),
        sends: balanceData.filter((item) => item.op === "TRANSFER"),
        total_sends: balanceData.filter((item) =>
          item.op === "TRANSFER"
        ).length,
        mints: balanceData.filter((item) => item.op === "MINT"),
        total_mints: balanceData.filter((item) => item.op === "MINT").length,
        total_holders: balanceData.length,
        holders: balanceData.map((row) => {
          const percentage = new BigFloat(row.amt).mul(100).div(
            mintProgressData.total_minted,
          );
          set_precision(-2);
          return {
            ...row,
            amt: new BigFloat(row.amt).toString(),
            percentage: parseFloat(percentage.toString()).toFixed(2),
          };
        }),
        mint_status: {
          ...mintProgressData,
          max_supply: mintProgressData.max_supply.toString(),
          total_minted: mintProgressData.total_minted.toString(),
          limit: mintProgressData.limit.toString(),
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
