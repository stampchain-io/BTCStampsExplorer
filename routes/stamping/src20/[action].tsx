import { Handlers, PageProps } from "$fresh/server.ts";

import { MintContent } from "$islands/stamping/src20/mint/MintContent.tsx";
import PopularMinting from "$islands/stamping/src20/mint/PopularMinting.tsx";
import { DeployContent } from "$islands/stamping/src20/deploy/DeployContent.tsx";
import RecentDeploy from "$islands/stamping/src20/deploy/RecentDeploy.tsx";
import { TransferContent } from "$islands/stamping/src20/transfer/TransferContent.tsx";
import LatestTransfer from "$islands/stamping/src20/transfer/LatestTransfer.tsx";

import { HowToDeployModule } from "$islands/modules/HowToDeploy.tsx";
import { HowToMintModule } from "$islands/modules/HowToMint.tsx";
import { HowToTransferModule } from "$islands/modules/HowToTransfer.tsx";

import { ResponseUtil } from "$lib/utils/responseUtil.ts";

import { Src20Controller } from "$server/controller/src20Controller.ts";

interface StampingSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  tick?: string | null;
  mintStatus?: any;
  holders?: number;
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
          if ((error as Error).message?.includes("not found")) {
            return ctx.renderNotFound();
          }
          throw error;
        }
      }

      return ctx.render({
        selectedTab: action,
        trxType,
        tick,
        mintStatus,
        holders,
      });
    } catch (error) {
      console.error("Error in stamping SRC20:", error);
      if ((error as Error).message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return ResponseUtil.internalError(
        error,
        "Internal Server Error",
      );
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
  } = data;

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

  const renderLeftSidebar = () => {
    switch (selectedTab) {
      case "mint":
        return <HowToMintModule />;
      case "deploy":
        return <HowToDeployModule />;
      case "transfer":
        return <HowToTransferModule />;
      default:
        return null;
    }
  };

  const renderRightSidebar = () => {
    switch (selectedTab) {
      case "mint":
        return <PopularMinting />;
      case "deploy":
        return <RecentDeploy />;
      case "transfer":
        return <LatestTransfer />;
      default:
        return null;
    }
  };

  return (
    <div class="flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <div class="self-center max-w-[680px] w-full mx-auto">
        {renderContent()}
      </div>

      <div class="flex flex-col gap-3 mobileMd:gap-6 w-full desktop:gap-9 tablet:flex-row">
        <div class="w-full tablet:w-1/2">
          {renderLeftSidebar()}
        </div>
        <div class="w-full tablet:w-1/2">
          {renderRightSidebar()}
        </div>
      </div>
    </div>
  );
}
