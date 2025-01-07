import { Handlers, PageProps } from "$fresh/server.ts";
import { RegisterBitnameContent } from "$islands/stamping/src101/register/RegisterContent.tsx";
import { HowToRegisterBitnameModule } from "$islands/modules/HowToRegisterBitname.tsx";
import RecentRegister from "$islands/stamping/src101/register/RecentRegister.tsx";

interface StampingSrc101PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
}

export const handler: Handlers<StampingSrc101PageProps> = {
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
      console.error("Error in stamping SRC-101:", error);
      if (error instanceof Error && error.message?.includes("not found")) {
        return ctx.renderNotFound();
      }
      throw error;
    }
  },
};

export default function StampingSrc101Page(
  { data }: PageProps<StampingSrc101PageProps>,
) {
  const { selectedTab, trxType } = data;

  const renderContent = () => {
    if (selectedTab === "mint") {
      return <RegisterBitnameContent trxType={trxType} />;
    }
    return null;
  };

  return (
    <div class="flex flex-col gap-12 mobileLg:gap-24 desktop:gap-36">
      <div class="self-center max-w-[680px] w-full mx-auto">
        {renderContent()}
      </div>

      <div class="flex flex-col gap-3 mobileMd:gap-6 w-full desktop:gap-9 tablet:flex-row">
        <div class="w-full tablet:w-1/2">
          <HowToRegisterBitnameModule />
        </div>
        <div class="w-full tablet:w-1/2">
          <RecentRegister />
        </div>
      </div>
    </div>
  );
}
