import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SecurityService } from "$server/services/security/securityService.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET(_req) {
    try {
      const token = await SecurityService.generateCSRFToken();

      return ResponseUtil.success(
        { token },
        {
          routeType: RouteType.DYNAMIC, // Never cache CSRF tokens
          forceNoCache: true,
        },
      );
    } catch (error) {
      return ResponseUtil.internalError(
        error,
        "Failed to generate CSRF token",
      );
    }
  },
};
