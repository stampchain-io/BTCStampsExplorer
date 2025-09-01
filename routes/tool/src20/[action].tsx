/* ===== SRC20 TOOLS PAGE ===== */
/*@baba-154+159*/
import { Handlers, PageProps } from "$fresh/server.ts";
import { body, containerBackground, gapSectionSlim } from "$layout";
import {
  SRC20DeployHowto,
  SRC20DeploysGallery,
  SRC20MintHowto,
  SRC20MintsGallery,
  SRC20TransferHowto,
  SRC20TransfersGallery,
} from "$section";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { SRC20DeployTool, SRC20MintTool, SRC20TransferTool } from "$tool";
import type { ToolSrc20PageProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

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
            {...(tick && { tick })}
            {...(mintStatus && { mintStatus })}
            {...(holders !== undefined && { holders })}
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
        return <SRC20MintHowto />;
      case "deploy":
        return <SRC20DeployHowto />;
      case "transfer":
        return <SRC20TransferHowto />;
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
    <div class={`${body} ${gapSectionSlim}`}>
      <div class={`flex w-full`}>
        {renderContent()}
      </div>
      <div
        class={`flex flex-col tablet:flex-row justify-between ${gapSectionSlim}`}
      >
        <div class="flex w-full tablet:w-1/2 h-fit">
          {renderLeftSidebar()}
        </div>
        <div class={`flex w-full tablet:w-1/2 h-fit ${containerBackground}`}>
          {renderRightSidebar()}
        </div>
      </div>
    </div>
  );
}
