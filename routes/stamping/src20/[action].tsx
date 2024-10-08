import { Handlers, PageProps } from "$fresh/server.ts";

import { MintContent } from "$islands/stamping/src20/mint/MintContent.tsx";
import PopularMinting from "$islands/stamping/src20/mint/PopularMinting.tsx";
import { DeployContent } from "$islands/stamping/src20/deploy/DeployContent.tsx";
import RecentDeploy from "$islands/stamping/src20/deploy/RecentDeploy.tsx";
import { TransferContent } from "$islands/stamping/src20/transfer/TransferContent.tsx";
import LatestTransfer from "$islands/stamping/src20/transfer/LatestTransfer.tsx";

import { FAQModule } from "$islands/modules/FAQ.tsx";

import { Src20Controller } from "$lib/controller/src20Controller.ts";

interface StampingSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  tick?: string | null;
  mintStatus?: any;
  holders?: number;
}

export const handler: Handlers<StampingSrc20PageProps> = {
  async GET(req, ctx) {
    const url = new URL(req.url);
    const action = ctx.params.action || "mint";
    const trxType = url.searchParams.get("trxType") as "multisig" | "olga" ||
      "multisig";
    const tick = url.searchParams.get("tick") || null;

    let mintStatus = null;
    let holders = 0;

    if (tick) {
      // Fetch mint status and holders on the server
      // Fetch mint status
      mintStatus = await Src20Controller.handleSrc20MintProgressRequest(tick);

      // Fetch holders count
      const balanceData = await Src20Controller.handleSrc20BalanceRequest({
        tick,
        includePagination: true,
        limit: 1,
        page: 1,
      });
      holders = balanceData.total || 0;
    }

    return ctx.render({
      selectedTab: action,
      trxType,
      tick,
      mintStatus,
      holders,
    });
  },
};

export default function StampingSrc20Page(
  { data }: PageProps<StampingSrc20PageProps>,
) {
  const { selectedTab, trxType, tick, mintStatus, holders } = data;

  const isMint = selectedTab === "mint";
  const flexDirection = isMint ? "lg:flex-row" : "md:flex-row";
  const columnWidth = isMint ? "lg:w-1/2" : "md:w-1/2";

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
    <div className="flex flex-col gap-16">
      <div className="self-center max-w-[680px] w-full mx-auto">
        {renderContent()}
      </div>

      <div className={`flex flex-col gap-6 w-full ${flexDirection}`}>
        <div className={`w-full ${columnWidth}`}>
          <FAQModule />
          {isMint && <RecentDeploy />}
        </div>
        <div className={`w-full ${columnWidth}`}>
          {renderSidebar()}
        </div>
      </div>
    </div>
  );
}
