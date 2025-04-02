import { Handlers, PageProps } from "$fresh/server.ts";

import { MintContent } from "$islands/stamping/src20/mint/MintContent.tsx";
import PopularMinting from "$islands/stamping/src20/mint/PopularMinting.tsx";
import { DeployContent } from "$islands/stamping/src20/deploy/DeployContent.tsx";
import RecentDeploy from "$islands/stamping/src20/deploy/RecentDeploy.tsx";
import { TransferContent } from "$islands/stamping/src20/transfer/TransferContent.tsx";
import LatestTransfer from "$islands/stamping/src20/transfer/LatestTransfer.tsx";

import { HowToDeployTokenModule } from "$islands/modules/HowToDeployToken.tsx";
import { HowToMintTokenModule } from "$islands/modules/HowToMintToken.tsx";
import { HowToTransferTokenModule } from "$islands/modules/HowToTransferToken.tsx";

import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import type { SRC20MintStatus } from "$lib/types/src20.d.ts";

interface StampingSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  tick?: string | null;
  mintStatus?: SRC20MintStatus | null;
  holders?: number;
  error?: string;
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
          mintStatus = await SRC20Service.QueryService
            .fetchSrc20MintProgress(tick);

          // Fetch holders count
          const balanceData = await Src20Controller.handleSrc20BalanceRequest({
            tick,
            includePagination: true,
            limit: 1,
            page: 1,
          });
          holders = balanceData.total || 0;
        } catch (error: unknown) {
          console.error("Error fetching SRC20 data:", error);
          if (error instanceof Error && error.message?.includes("not found")) {
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
    } catch (error: unknown) {
      console.error("Error in stamping SRC20:", error);
      if (error instanceof Error && error.message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      return ctx.render({
        error: error instanceof Error ? error.message : "Internal server error",
      } as StampingSrc20PageProps);
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
        return <HowToMintTokenModule />;
      case "deploy":
        return <HowToDeployTokenModule />;
      case "transfer":
        return <HowToTransferTokenModule />;
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
    <div class="flex flex-col gap-section-mobile mobileLg:gap-section-tablet tablet:gap-section-desktop">
      <div class="flex w-full">
        {renderContent()}
      </div>
      <div class="flex flex-col tablet:flex-row justify-between gap-section-mobile mobileLg:gap-section-tablet tablet:gap-section-desktop">
        <div class="flex w-full tablet:w-1/2 desktop:w-1/3">
          {renderLeftSidebar()}
        </div>
        <div class="flex w-full tablet:w-1/2 desktop:w-2/3">
          {renderRightSidebar()}
        </div>
      </div>
    </div>
  );
}
