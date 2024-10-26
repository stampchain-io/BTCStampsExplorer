import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  GET() {
    return ResponseUtil.error("This is a test error", 400);
  },
};
