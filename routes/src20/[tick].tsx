import { Handlers } from "$fresh/server.ts";
import { SRC20TickHeader } from "$components/src20/SRC20TickHeader.tsx";
import { SRC20DetailsTab } from "$islands/src20/SRC20DetailsTab.tsx";
import { convertEmojiToTick } from "utils/util.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { set_precision } from "bigfloat/mod.ts";
import { HoldersInfo } from "$components/HoldersInfo.tsx";
import { TransfersInfo } from "$components/TransfersInfo.tsx";

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      let { tick } = ctx.params;
      tick = convertEmojiToTick(tick);

      const balanceParams = {
        tick,
        sort: "DESC",
        includePagination: false,
      };

      const [
        // srcTrxResponse,
        balanceResponse,
        mintProgressResponse,
        allSrc20DataResponse,
      ] = await Promise.all([
        Src20Controller.handleSrc20BalanceRequest(balanceParams), // FIXME: sort by holder amt desc, make suer 0 bal are stripped
        Src20Controller.handleSrc20MintProgressRequest(tick),
        Src20Controller.handleAllSrc20DataForTickRequest(tick),
      ]);

      if (
        !mintProgressResponse ||
        !allSrc20DataResponse || !balanceResponse
      ) {
        throw new Error("Failed to fetch SRC20 data");
      }
      const allSrc20Data = await allSrc20DataResponse;
      const { deployment, mints, transfers } = allSrc20Data;
      const mintProgressData = await mintProgressResponse;
      const balanceData = await balanceResponse;
      const total_transfers = transfers.length;
      const total_mints = mints.length;
      const totalCount = total_transfers + total_mints;

      set_precision(-4);
      const body = {
        last_block: balanceData.last_block,
        deployment: deployment,
        transfers: transfers,
        total_transfers: total_transfers,
        mints: mints,
        total_mints: total_mints,
        total_holders: balanceData.data.length,
        holders: balanceData.data.map((row) => {
          const amt = formatAmount(row.amt || "0");
          const totalMinted = formatAmount(
            mintProgressData.total_minted || "1",
          );
          const percentage = calculatePercentage(amt, totalMinted);
          return { ...row, amt, percentage };
        }),
        mint_status: {
          ...mintProgressData,
          max_supply: mintProgressData.max_supply?.toString() || "0",
          total_minted: mintProgressData.total_minted?.toString() || "0",
          limit: mintProgressData.limit?.toString() || "0",
        },
        total_transactions: totalCount,
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
    transfers,
    mints,
    total_holders,
    holders,
    mint_status,
    total_mints,
    last_block,
    total_transfers,
  } = props.data;

  return (
    <div class="flex flex-col gap-8">
      <SRC20TickHeader
        deployment={deployment}
        mint_status={mint_status}
        total_holders={total_holders}
        total_mints={total_mints}
        total_transfers={total_transfers}
      />
      <div class="w-full flex flex-col md:flex-row gap-20 justify-center">
        <div class="w-full md:w-2/5 h-full">
          <SRC20DetailsTab
            holders={holders}
            transfers={transfers}
            mints={mints}
          />
        </div>
        <div class="relative w-full md:w-3/5 flex justify-center">
          <HoldersInfo holders={holders} />
          {/* <TransfersInfo transfers={transfers} /> */}
        </div>
      </div>
    </div>
  );
};

export default SRC20TickPage;
