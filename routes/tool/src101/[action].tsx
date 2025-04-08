/* ===== SRC101 TOOLS PAGE ===== */
/*@baba-60+61+65*/
import { Handlers, PageProps } from "$fresh/server.ts";
import { body, gapSection } from "$layout";
import { RecentBitnameRegister, RegisterBitnameContent } from "$tool";
import { HowToRegisterBitnameModule } from "$howto";

/* ===== TYPES ===== */
interface ToolsSrc101PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
}

/* ===== SERVER HANDLER ===== */
export const handler: Handlers<ToolsSrc101PageProps> = {
  GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const action = ctx.params.action || "mint";

      // Currently only supporting mint action for SRC-101
      if (action !== "mint") {
        return ctx.renderNotFound();
      }

      const trxType =
        (url.searchParams.get("trxType") as "multisig" | "olga") ||
        "multisig";

      return ctx.render({
        selectedTab: action,
        trxType,
      });
    } catch (error) {
      console.error("Error in registering bitname domain:", error);
      if (error instanceof Error && error.message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      throw error;
    }
  },
};

/* ===== PAGE COMPONENT ===== */
export default function ToolsSrc101Page(
  { data }: PageProps<ToolsSrc101PageProps>,
) {
  const { selectedTab, trxType } = data;

  /* ===== HELPERS ===== */
  const renderContent = () => {
    if (selectedTab === "mint") {
      return <RegisterBitnameContent trxType={trxType} />;
    }
    return null;
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
        <div class="w-full tablet:w-full">
          <HowToRegisterBitnameModule />
        </div>
        <div class="w-full tablet:w-1/2 hidden">
          <RecentBitnameRegister />
        </div>
      </div>
    </div>
  );
}
