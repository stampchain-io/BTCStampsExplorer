import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { VERSION_CONFIG } from "../../../server/middleware/apiVersionMiddleware.ts";

export const handler: Handlers = {
  GET(_req, ctx) {
    // Return the version being used for this request
    const requestedVersion = ctx.state?.apiVersion ||
      VERSION_CONFIG.defaultVersion;

    return ResponseUtil.success({
      version: requestedVersion,
      default: VERSION_CONFIG.defaultVersion,
      supported: VERSION_CONFIG.supportedVersions,
    });
  },
};
