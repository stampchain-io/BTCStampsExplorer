import { Handlers, PageProps } from "$fresh/server.ts";
import { StampingSrc20PageProps } from "globals";
import { StampingSrc20Header } from "$islands/stamping/StampingSrc20Header.tsx";
import { MintContent } from "$islands/stamping/MintContent.tsx";
import { DeployContent } from "$islands/stamping/DeployContent.tsx";
import { TransferContent } from "$islands/stamping/TransferContent.tsx";
import { FAQModule } from "$islands/modules/FAQ.tsx";

export const handler: Handlers = {
  GET(_req, ctx) {
    const action = ctx.params.action || "mint";
    return ctx.render({ selectedTab: action });
  },
};

export default function StampingSrc20Page(
  { data }: PageProps<StampingSrc20PageProps>,
) {
  const { selectedTab } = data;

  return (
    <div className={"flex flex-col gap-16"}>
      <StampingSrc20Header selectedTab={selectedTab} />
      <div className="self-center max-w-[680px] mx-auto">
        {selectedTab === "mint" && <MintContent />}
        {selectedTab === "deploy" && <DeployContent />}
        {selectedTab === "transfer" && <TransferContent />}
      </div>
      <div className={"flex gap-6 w-full"}>
        <div className={"w-1/2"}>
          <FAQModule />
        </div>
        {selectedTab === "mint" && (
          <div className={"w-1/2 flex flex-col gap-4 items-end"}>
            <h1
              className={"bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black"}
            >
              MINTING
            </h1>
            <p className={"text-2xl md:text-5xl text-[#AA00FF]"}>LOREM IPSUM</p>
            <a class="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 text-center min-w-[132px] rounded-md cursor-pointer">
              View All
            </a>
          </div>
        )}
        {selectedTab === "deploy" && (
          <div className={"w-1/2 flex flex-col gap-4 items-end"}>
            <h1
              className={"bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black"}
            >
              RECENT DEPLOYS
            </h1>
            <p className={"text-2xl md:text-5xl text-[#AA00FF]"}>LOREM IPSUM</p>
            <a class="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 text-center min-w-[132px] rounded-md cursor-pointer">
              View All
            </a>
          </div>
        )}
        {selectedTab === "transfer" && (
          <div className={"w-1/2 flex flex-col gap-4 items-end"}>
            <h1
              className={"bg-clip-text text-transparent bg-gradient-to-r from-[#AA00FF] via-[#660099] to-[#440066] text-3xl md:text-6xl font-black"}
            >
              LATEST TRANSFERS
            </h1>
            <p className={"text-2xl md:text-5xl text-[#AA00FF]"}>LOREM IPSUM</p>
            <a class="text-[#660099] text-sm md:text-base font-light border-2 border-[#660099] py-1 text-center min-w-[132px] rounded-md cursor-pointer">
              View All
            </a>
          </div>
        )}
      </div>
    </div>
  );
}
