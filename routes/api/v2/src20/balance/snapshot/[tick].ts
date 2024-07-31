import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { convertEmojiToTick } from "utils/util.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
  async GET(req, ctx) {
    let { tick } = ctx.params;
    const url = new URL(req.url);
    const params = url.searchParams;

    const snapshotParams = {
      tick: convertEmojiToTick(String(tick)),
      limit: Number(params.get("limit")) || 1000,
      page: Number(params.get("page")) || 1,
      amt: Number(params.get("amt")) || 0,
      sort: params.get("sort") || "ASC",
    };

    return await Src20Controller.handleSrc20SnapshotRequest(snapshotParams);
  },
};
