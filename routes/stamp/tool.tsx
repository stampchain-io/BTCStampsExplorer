import { StampToolPageProps } from "globals";
import { Handlers } from "$fresh/server.ts";

import { StampToolHeader } from "$islands/stamp/tool/StampToolHeader.tsx";
import { FileContent } from "$islands/stamp/tool/FileContent.tsx";

//TODO: Add pagination

export const handler: Handlers = {
  async GET(req: Request, ctx) {
    try {
      const url = new URL(req.url);
      const selectedTab = url.searchParams.get("ident") || "file";
      const res = { selectedTab };
      return await ctx.render(res);
    } catch (error) {
      console.error(error);
      const body = { error: `Error: Internal server error` };
      return ctx.render(body);
    }
  },
};

export function StampToolPage(props: StampToolPageProps) {
  const { selectedTab } = props.data;
  return (
    <div>
      <StampToolHeader selectedTab={selectedTab} />
      <div className={"self-center max-w-[680px] mx-auto"}>
        {selectedTab === "file" && <FileContent />}
      </div>
    </div>
  );
}
export default StampToolPage;
