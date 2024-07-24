import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

const API_VERSION = "2.0.0";

export const handler: Handlers = {
  GET() {
    return ResponseUtil.success({ version: API_VERSION });
  },
};
