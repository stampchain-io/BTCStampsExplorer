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

      const [srcTrxResponse, balanceResponse, mintProgressResponse] =
        await Promise.all([
          SRC20Repository.getValidSrc20TxFromDb(balanceParams),
          Src20Controller.handleSrc20BalanceRequest(balanceParams),
          Src20Controller.handleSrc20MintProgressRequest(tick),
        ]);

      if (!srcTrxResponse || !mintProgressResponse) {
        throw new Error("Failed to fetch SRC20 data");
      }

      const trxData = await srcTrxResponse.rows;
      const mintProgressData = await mintProgressResponse.json();
      const balanceData = await balanceResponse.json();

      console.log("Balance Data:", trxData);
      console.log("Mint Progress Data:", mintProgressData);

      set_precision(-4);
      const body = {
        last_block: trxData[0]?.block_index,
        deployment: trxData.find((item) => item.op === "DEPLOY"),
        sends: trxData.filter((item) => item.op === "TRANSFER"),
        total_sends: trxData.filter((item) => item.op === "TRANSFER").length,
        mints: trxData.filter((item) => item.op === "MINT"),
        total_mints: trxData.filter((item) => item.op === "MINT").length,
        total_holders: balanceData.data.length,
        holders: balanceData.data
          .map((row) => {
            const amt = formatAmount(row.amt || "0");
            const totalMinted = formatAmount(
              mintProgressData.total_minted || "1",
            );
            const percentage = calculatePercentage(amt, totalMinted);
            return { ...row, amt, percentage };
          })
          .sort((a, b) => {
            const amtA = parseFloat(a.amt.replace(/,/g, ""));
            const amtB = parseFloat(b.amt.replace(/,/g, ""));
            return amtB - amtA; // Sort in descending order
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

function formatAmount(value: string): string {
  // Remove leading zeros and split into whole and decimal parts
  const [whole, decimal = ""] = value.replace(/^0+/, "").split(".");
  // Remove trailing zeros from decimal part
  const trimmedDecimal = decimal.replace(/0+$/, "");
  return trimmedDecimal ? `${whole}.${trimmedDecimal}` : whole;
}

function calculatePercentage(amount: string, total: string): string {
  const amountNum = parseFloat(amount.replace(/,/g, ""));
  const totalNum = parseFloat(total.replace(/,/g, ""));
  if (totalNum === 0) return "0.00";
  const percentage = (amountNum / totalNum) * 100;
  return percentage.toFixed(2);
}

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
