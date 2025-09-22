import { XCP_V2_NODES } from "$constants";
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";

export const handler: Handlers = {
  async GET() {
    for (const node of XCP_V2_NODES) {
      try {
        const res = await fetch(node.url, { method: "GET" });
        if (!res.ok) continue;
        const data = await res.json() as {
          result?: { version?: string };
        };
        const version = data?.result?.version;
        if (version) {
          return ApiResponseUtil.success({ version }, { forceNoCache: true });
        }
      } catch (_e) {
        // try next node
      }
    }
    return ApiResponseUtil.serviceUnavailable(
      "Unable to fetch Counterparty version",
    );
  },
};
