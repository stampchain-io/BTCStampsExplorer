import { MintPageProps } from "globals";
import { MintHeader } from "$islands/mint/MintHeader.tsx";
import { Handlers } from "$fresh/server.ts";
import { MintContent } from "$islands/mint/MintContent.tsx";
import { DeployContent } from "$islands/mint/DeployContent.tsx";

//TODO: Add pagination

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
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

export function MintPage(props: MintPageProps) {
  const { selectedTab } = props.data;
  return (
    <div>
      <MintHeader selectedTab={selectedTab} />
      <div className={"self-center max-w-[680px] mx-auto"}>
        {selectedTab === "mint" && <MintContent />}
        {selectedTab === "deploy" && <DeployContent />}
      </div>
    </div>
  );
}
export default MintPage;
