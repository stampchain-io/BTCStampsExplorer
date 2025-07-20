import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { getClientConfig } from "$server/config/config.ts";

export const handler: Handlers = {
  GET(_req) {
    const clientConfig = getClientConfig();
    return ApiResponseUtil.success(clientConfig);
  },
};
