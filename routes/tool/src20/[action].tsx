/* ===== SRC20 TOOLS PAGE ===== */
/*@baba-154+159*/
import { Handlers, PageProps } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import type { SRC20MintStatus } from "$lib/types/src20.d.ts";
import { body, gapSection } from "$layout";
import { SRC20DeployTool, SRC20MintTool, SRC20TransferTool } from "$tool";
import {
  HowToDeployTokenModule,
  HowToMintTokenModule,
  HowToTransferTokenModule,
} from "$section";
import {
  SRC20DeploysGallery,
  SRC20MintsGallery,
  SRC20TransfersGallery,
} from "$gallery";

/* ===== TYPES ===== */
interface ToolSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  tick?: string | null;
  mintStatus?: SRC20MintStatus | null;
  holders?: number;
  error?: string;
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<ToolSrc20PageProps> = {
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
      } as ToolSrc20PageProps);
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function ToolSrc20Page(
  { data }: PageProps<ToolSrc20PageProps>,
) {
  const {
    selectedTab,
    trxType,
    tick,
    mintStatus,
    holders,
  } = data;

  /* ===== HELPERS ===== */
  const renderContent = () => {
    switch (selectedTab) {
      case "mint":
        return (
          <SRC20MintTool
            trxType={trxType}
            tick={tick}
            mintStatus={mintStatus}
            holders={holders}
          />
        );
      case "deploy":
        return <SRC20DeployTool trxType={trxType} />;
      case "transfer":
        return <SRC20TransferTool trxType={trxType} />;
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
        return <SRC20MintsGallery />;
      case "deploy":
        return <SRC20DeploysGallery />;
      case "transfer":
        return <SRC20TransfersGallery />;
      default:
        return null;
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
        <div className="flex w-full tablet:w-1/2 desktop:w-1/3">
          {renderLeftSidebar()}
        </div>
        <div className={`flex w-full tablet:w-1/2 desktop:w-2/3`}>
          {renderRightSidebar()}
        </div>
      </div>
    </div>
  );
}
