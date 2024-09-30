import { Handlers, PageProps } from "$fresh/server.ts";

import { MintContent } from "$islands/stamping/src20/mint/MintContent.tsx";
import PopularMinting from "$islands/stamping/src20/mint/PopularMinting.tsx";
import { DeployContent } from "$islands/stamping/src20/deploy/DeployContent.tsx";
import RecentDeploy from "$islands/stamping/src20/deploy/RecentDeploy.tsx";
import { TransferContent } from "$islands/stamping/src20/transfer/TransferContent.tsx";
import LatestTransfer from "$islands/stamping/src20/transfer/LatestTransfer.tsx";

import { FAQModule } from "$islands/modules/FAQ.tsx";

interface StampingSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
}

export const handler: Handlers<StampingSrc20PageProps> = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const action = ctx.params.action || "mint";
    const trxType = url.searchParams.get("trxType") as "multisig" | "olga" ||
      "multisig";
    return ctx.render({ selectedTab: action, trxType });
  },
};

export default function StampingSrc20Page(
  { data }: PageProps<StampingSrc20PageProps>,
) {
  const { selectedTab, trxType } = data;

  return (
    <div className="flex flex-col gap-16">
      {/* <StampingSrc20Header selectedTab={selectedTab} /> */}

      <div className="self-center max-w-[680px] w-full mx-auto">
        {selectedTab === "mint" && <MintContent trxType={trxType} />}
        {selectedTab === "deploy" && <DeployContent trxType={trxType} />}
        {selectedTab === "transfer" && <TransferContent trxType={trxType} />}
      </div>

      <div className="flex flex-col md:flex-row gap-6 w-full px-2 md:px-0">
        <div className="w-full md:w-1/2">
          <FAQModule />
        </div>
        {selectedTab === "mint" && <PopularMinting />}
        {selectedTab === "deploy" && <RecentDeploy />}
        {selectedTab === "transfer" && <LatestTransfer />}
      </div>
    </div>
  );
}
