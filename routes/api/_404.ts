import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    const path = ctx.url.pathname;
    return ResponseUtil.error(`API endpoint not found: ${path}`, 404);
  },
  POST(_req, ctx) {
    const path = ctx.url.pathname;
    return ResponseUtil.error(`API endpoint not found: ${path}`, 404);
  },
};
