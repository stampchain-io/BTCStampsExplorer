import { StampingSrc20PageProps } from "globals";
import { Handlers } from "$fresh/server.ts";
import { StampingSrc20Header } from "$islands/stamping/StampingSrc20Header.tsx";
import { MintContent } from "$islands/stamping/MintContent.tsx";
import { DeployContent } from "$islands/stamping/DeployContent.tsx";
import { TransferContent } from "$islands/stamping/TransferContent.tsx";

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      const url = new URL(_req.url);
      const selectedTab = url.searchParams.get("ident") || "mint";
      const res = { selectedTab };
      return await ctx.render(res);
    } catch (error) {
      console.error(error);
      const body = { error: `Error: Internal server error` };
      return ctx.render(body);
    }
  },
};

export function StampingSrc20Page(props: StampingSrc20PageProps) {
  const { selectedTab } = props.data;

  return (
    <div>
      <StampingSrc20Header selectedTab={selectedTab} />
      <div className={"self-center max-w-[680px] mx-auto"}>
        {selectedTab === "mint" && <MintContent />}
        {selectedTab === "deploy" && <DeployContent />}
        {selectedTab === "transfer" && <TransferContent />}
      </div>
    </div>
  );
}
export default StampingSrc20Page;
