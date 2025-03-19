import { Handlers, PageProps } from "$fresh/server.ts";

import { TransferStampContent } from "$islands/stamping/stamp/transfer/TransferStampContent.tsx";
import LatestTransfer from "$islands/stamping/stamp/transfer/LatestStampTransfer.tsx";

import { HowToTransferStampModule } from "$islands/modules/HowToTransferStamp.tsx";

export const handler: Handlers = {
  GET(req, ctx) {
    console.log("Handler called for [action] route");
    const data = {
      selectedTab: "transfer", // Example data
      trxType: "olga", // Example data
    };
    console.log("Data prepared:", data);
    return ctx.render(data);
  },
};

export default function StampingStampPage(
  { data }: PageProps<StampingStampPageProps>,
) {
  console.log("StampingStampPage component rendered");

  const {
    selectedTab = "defaultTab",
    trxType = "defaultType",
  } = data || {};

  console.log("Data received:", data);
  console.log("Selected Tab:", selectedTab);
  console.log("Transaction Type:", trxType);

  const renderContent = () => {
    console.log("Rendering Content for Tab:", selectedTab);
    switch (selectedTab) {
      case "transfer":
        return <TransferStampContent trxType={trxType} />;
      default:
        return <div>No content available for this tab.</div>;
    }
  };

  const renderLeftSidebar = () => {
    console.log("Rendering Left Sidebar for Tab:", selectedTab);
    switch (selectedTab) {
      case "transfer":
        return <HowToTransferStampModule />;
      default:
        return <div>No sidebar content available for this tab.</div>;
    }
  };

  const renderRightSidebar = () => {
    console.log("Rendering Right Sidebar for Tab:", selectedTab);
    switch (selectedTab) {
      case "transfer":
        return <LatestTransfer />;
      default:
        return <div>No sidebar content available for this tab.</div>;
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
