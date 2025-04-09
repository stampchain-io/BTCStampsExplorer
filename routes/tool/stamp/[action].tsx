/* ===== STAMP TOOLS PAGE ===== */
/*@baba-71-82*/
import { Handlers, PageProps } from "$fresh/server.ts";
import { body, gapSection } from "$layout";
import { StampTransferTool } from "$tool";
import { StampTransfersGallery } from "$gallery";
import { HowToTransferStampModule } from "$howto";

/* ===== TYPES ===== */
interface ToolStampPageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  error?: string;
}

/* ===== SERVER HANDLER ===== */
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

/* ===== PAGE COMPONENT ===== */
export default function ToolStampPage(
  { data }: PageProps<ToolStampPageProps>,
) {
  console.log("ToolStampPage component rendered");

  /* ===== DATA EXTRACTION ===== */
  const {
    selectedTab = "defaultTab",
    trxType = "defaultType",
  } = data || {};

  console.log("Data received:", data);
  console.log("Selected Tab:", selectedTab);
  console.log("Transaction Type:", trxType);

  /* ===== CONTENT RENDERING HELPERS ===== */
  const renderContent = () => {
    console.log("Rendering Content for Tab:", selectedTab);
    switch (selectedTab) {
      case "transfer":
        return <StampTransferTool trxType={trxType} />;
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
        return <StampTransfersGallery />;
      default:
        return <div>No sidebar content available for this tab.</div>;
    }
  };

  /* ===== RENDER ===== */
  return (
    <div className={`${body} ${gapSection}`}>
      <div className={`flex w-full`}>
        {renderContent()}
      </div>

      <div
        className={`flex flex-col tablet:flex-row justify-between ${gapSection}`}
      >
        <div className="flex w-full tablet:w-1/2">
          {renderLeftSidebar()}
        </div>
        <div className="flex w-full tablet:w-1/2">
          {renderRightSidebar()}
        </div>
      </div>
    </div>
  );
}
