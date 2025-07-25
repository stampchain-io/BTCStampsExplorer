import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";

export const handler: Handlers = {
  GET(req, _ctx) {
    const url = new URL(req.url);
    return ApiResponseUtil.notFound(
      `API v2 Endpoint not found: ${url.pathname}`,
    );
  },
  POST(req, _ctx) {
    const url = new URL(req.url);
    return ApiResponseUtil.notFound(
      `API v2 Endpoint not found: ${url.pathname}`,
    );
  },
  // Add other methods as needed (PUT, DELETE, etc.)
};
