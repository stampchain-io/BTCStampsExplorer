import { Handlers } from "$fresh/server.ts";
import { AddressTickHandlerContext } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

export const handler: Handlers<AddressTickHandlerContext> = {
  async GET(_req, ctx) {
    const { address, tick } = ctx.params;
    const params = {
      address,
      tick: tick.toString(),
      includePagination: false,
    };
    return await Src20Controller.handleSrc20BalanceRequest(params);
  },
};
