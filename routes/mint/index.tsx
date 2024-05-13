import { HandlerContext } from "$fresh/server.ts";
import { MintHeader } from "$islands/mint/MintHeader.tsx";

import { CommonClass, getClient } from "$lib/database/index.ts";
import { useState } from "preact/hooks";
import { paginate } from "utils/util.ts";
import { UploadImage } from "../../islands/mint/UploadImage.tsx";

//TODO: Add pagination

export const handler = {
  async GET(req: Request, ctx: HandlerContext) {
    try {
      const url = new URL(req.url);
      const body = {};
      return await ctx.render(body);
    } catch (error) {
      console.error(error);
      const body = { error: `Error: Internal server error` };
      return ctx.render(body);
    }
  },
};

export function MintPage(props) {
  const { data, total, page, pages, limit } = props.data;
  return (
    <div className={"self-center"}>
      <MintHeader />
      <div class={"text-yellow-600 text-[26px] font-bold"}>
        Mint OLGA Stamp (P2WSH)
      </div>
      <UploadImage />
    </div>
  );
}
export default MintPage;
