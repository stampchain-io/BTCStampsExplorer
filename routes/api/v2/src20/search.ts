import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || "";

      const results = await Src20Controller.handleSearchRequest(query);

      return ResponseUtil.success({ data: results });
    } catch (error) {
      console.error("Error in search handler:", error);
      return ResponseUtil.handleError(error, "Error processing search request");
    }
  },
};
