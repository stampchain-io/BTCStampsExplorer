import { Handlers, PageProps } from "$fresh/server.ts";
import { StampingSrc20Header } from "$islands/stamping/StampingSrc20Header.tsx";
import { MintContent } from "$islands/stamping/MintContent.tsx";
import { DeployContent } from "$islands/stamping/DeployContent.tsx";
import { TransferContent } from "$islands/stamping/TransferContent.tsx";
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
    <div className={"flex flex-col gap-16"}>
      <StampingSrc20Header selectedTab={selectedTab} />
      <div className="self-center max-w-[680px] mx-auto">
        {selectedTab === "mint" && <MintContent trxType={trxType} />}
        {selectedTab === "deploy" && <DeployContent trxType={trxType} />}
        {selectedTab === "transfer" && <TransferContent trxType={trxType} />}
      </div>
      <div className={"flex flex-col md:flex-row gap-6 w-full px-2 md:px-0"}>
        <div className={"w-full md:w-1/2"}>
          <FAQModule />
        </div>
        {selectedTab === "mint" && (
          <div
            className={"w-full md:w-1/2 flex flex-col gap-4 items-start md:items-end"}
          >
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
          <div
            className={"w-full md:w-1/2 flex flex-col gap-4 items-start md:items-end"}
          >
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
          <div
            className={"w-full md:w-1/2 flex flex-col gap-4 items-start md:items-end"}
          >
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
