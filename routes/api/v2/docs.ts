import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

const API_DOCS = {
  version: "2.0.0",
  endpoints: [
    { path: "/api/v2/health", description: "Health check endpoint" },
    { path: "/docs", description: "API documentation" },
  ],
};

export const handler: Handlers = {
  GET() {
    return ResponseUtil.success(API_DOCS);
  },
};
