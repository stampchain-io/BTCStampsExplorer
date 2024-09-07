import { Handlers, PageProps } from "$fresh/server.ts";
import { StampingSrc20PageProps } from "globals";
import { StampingSrc20Header } from "$islands/stamping/StampingSrc20Header.tsx";
import { MintContent } from "$islands/stamping/MintContent.tsx";
import { DeployContent } from "$islands/stamping/DeployContent.tsx";
import { TransferContent } from "$islands/stamping/TransferContent.tsx";

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
    <div>
      <StampingSrc20Header selectedTab={selectedTab} />
      <div className="self-center max-w-[680px] mx-auto">
        {selectedTab === "mint" && <MintContent />}
        {selectedTab === "deploy" && <DeployContent />}
        {selectedTab === "transfer" && <TransferContent />}
      </div>
    </div>
  );
}
