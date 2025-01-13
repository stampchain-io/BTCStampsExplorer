import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    return ResponseUtil.notFound(`API Endpoint not found: ${url.pathname}`);
  },
  POST(req, _ctx) {
    const url = new URL(req.url);
    return ResponseUtil.notFound(`API Endpoint not found: ${url.pathname}`);
  },
  // Add other methods as needed (PUT, DELETE, etc.)
};
