import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    return ResponseUtil.error(
      `API v2 Endpoint not found: ${url.pathname}`,
      404,
    );
  },
  POST(req, _ctx) {
    const url = new URL(req.url);
    return ResponseUtil.error(
      `API v2 Endpoint not found: ${url.pathname}`,
      404,
    );
  },
  // Add other methods as needed (PUT, DELETE, etc.)
};
