/* ===== SRC101 TOOLS PAGE ===== */
import { Handlers, PageProps } from "$fresh/server.ts";
import { RecentBitnameRegister, RegisterBitnameContent } from "$tools";
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
    <div class="flex flex-col gap-12 mobileLg:gap-24">
      <div class="self-center max-w-[680px] w-full mx-auto">
        {renderContent()}
      </div>

      <div class="flex flex-col tablet:flex-row w-full gap-6 desktop:gap-9">
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
