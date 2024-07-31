import { Handlers } from "$fresh/server.ts";
import { AddressHandlerContext } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

export const handler: Handlers<AddressHandlerContext> = {
  async GET(req, ctx) {
    const { address } = ctx.params;
    const url = new URL(req.url);
    const params = url.searchParams;

    const balanceParams = {
      address,
      limit: Number(params.get("limit")) || 1000,
      page: Number(params.get("page")) || 1,
      amt: Number(params.get("amt")) || 0,
      sort: params.get("sort") || "ASC",
    };

    return await Src20Controller.handleSrc20BalanceRequest(balanceParams);
  },
};
