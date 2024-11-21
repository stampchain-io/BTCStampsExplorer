import { Handlers, PageProps } from "$fresh/server.ts";

import { MintContent } from "$islands/stamping/src20/mint/MintContent.tsx";
import PopularMinting from "$islands/stamping/src20/mint/PopularMinting.tsx";
import { DeployContent } from "$islands/stamping/src20/deploy/DeployContent.tsx";
import RecentDeploy from "$islands/stamping/src20/deploy/RecentDeploy.tsx";
import { TransferContent } from "$islands/stamping/src20/transfer/TransferContent.tsx";
import LatestTransfer from "$islands/stamping/src20/transfer/LatestTransfer.tsx";

import { FAQModule } from "$islands/modules/FAQMint.tsx";

import { Src20Controller } from "$server/controller/src20Controller.ts";

interface StampingSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  tick?: string | null;
  mintStatus?: any;
  holders?: number;
  recentTransactions: {
    deploy: any[];
    mint: any[];
    transfer: any[];
  };
  trendingTokens: any[];
}

export const handler: Handlers<StampingSrc20PageProps> = {
  async GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const action = ctx.params.action || "mint";

      // Validate action parameter first
      if (!["mint", "deploy", "transfer"].includes(action)) {
        return ctx.renderNotFound();
      }

      const trxType =
        (url.searchParams.get("trxType") as "multisig" | "olga") ||
        "olga";
      const tick = url.searchParams.get("tick") || null;

      let mintStatus = null;
      let holders = 0;

      if (tick) {
        try {
          // Fetch mint status and holders on the server
          mintStatus = await Src20Controller.handleSrc20MintProgressRequest(
            tick,
          );

          // Fetch holders count
          const balanceData = await Src20Controller.handleSrc20BalanceRequest({
            tick,
            includePagination: true,
            limit: 1,
            page: 1,
          });
          holders = balanceData.total || 0;
        } catch (error) {
          console.error("Error fetching SRC20 data:", error);
          if (error.message?.includes("not found")) {
            return ctx.renderNotFound();
          }
          throw error;
        }
      }

      // Initialize variables
      let recentTransactions = {
        deploy: [],
        mint: [],
        transfer: [],
      };
      const trendingTokens: any[] = [];

      if (action === "mint") {
        // Fetch trending tokens for PopularMinting
        const limit = 8;
        const page = 1;
        const transactionCount = 1000;

        const trendingData = await Src20Controller.fetchTrendingTokens(
          req,
          limit,
          page,
          transactionCount,
        );

        trendingTokens.push(...trendingData.data);

        // Fetch recent deploys for RecentDeploy
        const recentDeploysData = await Src20Controller
          .fetchRecentTransactions();
        recentTransactions.deploy = recentDeploysData.deploy;
      } else {
        recentTransactions = await Src20Controller.fetchRecentTransactions();
      }

      return ctx.render({
        selectedTab: action,
        trxType,
        tick,
        mintStatus,
        holders,
        recentTransactions,
        trendingTokens,
      });
    } catch (error) {
      console.error("Error in stamping SRC20:", error);
      if ((error as Error).message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};

export default function StampingSrc20Page(
  { data }: PageProps<StampingSrc20PageProps>,
) {
  const {
    selectedTab,
    trxType,
    tick,
    mintStatus,
    holders,
    recentTransactions,
    trendingTokens,
  } = data;

  const isMint = selectedTab === "mint";
  const flexDirection = isMint ? "tablet:flex-row" : "tablet:flex-row";
  const columnWidth = isMint ? "tablet:w-1/2" : "tablet:w-1/2";

  const renderContent = () => {
    switch (selectedTab) {
      case "mint":
        return (
          <MintContent
            trxType={trxType}
            tick={tick}
            mintStatus={mintStatus}
            holders={holders}
          />
        );
      case "deploy":
        return <DeployContent trxType={trxType} />;
      case "transfer":
        return <TransferContent trxType={trxType} />;
      default:
        return null;
    }
  };

  const renderSidebar = () => {
    switch (selectedTab) {
      case "mint":
        return <PopularMinting transactions={trendingTokens} />;
      case "deploy":
        return <RecentDeploy transactions={recentTransactions.deploy} />;
      case "transfer":
        return <LatestTransfer transactions={recentTransactions.transfer} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <div className="self-center max-w-[680px] w-full mx-auto">
        {renderContent()}
      </div>

      <div
        className={`flex flex-col gap-3 mobileMd:gap-6 w-full desktop:gap-9 ${flexDirection}`}
      >
        <div className={`w-full ${columnWidth}`}>
          <FAQModule />
          {isMint && <RecentDeploy transactions={recentTransactions.deploy} />}
        </div>
        <div className={`w-full ${columnWidth}`}>
          {renderSidebar()}
        </div>
      </div>
    </div>
  );
}
