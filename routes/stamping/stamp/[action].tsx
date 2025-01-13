import { Handlers, PageProps } from "$fresh/server.ts";

import { TransferStampContent } from "$islands/stamping/stamp/transfer/TransferStampContent.tsx";
import LatestTransfer from "$islands/stamping/stamp/transfer/LatestStampTransfer.tsx";

import { HowToTransferStampModule } from "$islands/modules/HowToTransferStamp.tsx";

export default function StampingStampPage(
  { data }: PageProps<StampingStampPageProps>,
) {
  const {
    selectedTab = "defaultTab",
    trxType = "defaultType",
  } = data || {};

  console.log("Selected Tab:", selectedTab);
  console.log("Transaction Type:", trxType);

  const renderContent = () => {
    switch (selectedTab) {
      case "transfer":
        return <TransferStampContent trxType={trxType} />;
      default:
        return null;
    }
  };

  const renderLeftSidebar = () => {
    switch (selectedTab) {
      case "transfer":
        return <HowToTransferStampModule />;
      default:
        return null;
    }
  };

  const renderRightSidebar = () => {
    switch (selectedTab) {
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

      <div class="flex flex-col tablet:flex-row gap-12 mobileLg:gap-24 tablet:gap-6 desktop:gap-9">
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
