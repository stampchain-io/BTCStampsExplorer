import { FreshContext } from "$fresh/server.ts";
import { ApiResponseUtil } from "../../../../lib/utils/apiResponseUtil.ts";
import {
  getEndpointDeprecationInfo,
  isEndpointDeprecated,
  VERSION_CONFIG,
} from "../../../../server/middleware/apiVersionMiddleware.ts";

/**
 * Cursed Endpoint Deprecation Middleware
 *
 * Handles deprecation of /cursed endpoints in API v2.3+
 * - v2.2 and below: Allow access normally
 * - v2.3+: Return deprecation notice and redirect to alternative
 */

export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Get the API version from context (set by API version middleware)
  const apiVersion = (ctx.state.apiVersion as string) ||
    VERSION_CONFIG.defaultVersion;

  // Check if this endpoint is deprecated in the current API version
  if (isEndpointDeprecated(pathname, apiVersion)) {
    const deprecationInfo = getEndpointDeprecationInfo(pathname);

    if (deprecationInfo) {
      // Use standardized ApiResponseUtil.gone() method for consistent error responses
      return ApiResponseUtil.gone(
        `Endpoint ${pathname} is deprecated in API v${apiVersion}`,
        {
          deprecated: true,
          reason: deprecationInfo.reason,
          alternative: deprecationInfo.alternative,
          endOfLife: deprecationInfo.endOfLife,
          migrationGuide:
            "https://stampchain.io/docs/api/migration/cursed-to-stamps",
          currentVersion: apiVersion,
          supportedAlternative: {
            endpoint: deprecationInfo.alternative,
            description:
              "Use the stamps endpoint with type=cursed filter for cursed stamps",
            example: `${deprecationInfo.alternative}&limit=10&page=1`,
          },
        },
        {
          headers: {
            "Deprecation": "true",
            "Sunset": deprecationInfo.endOfLife,
            "Link":
              `<${deprecationInfo.alternative}>; rel="alternate"; title="Use stamps endpoint instead"`,
            "X-Deprecated-Endpoint": pathname,
            "X-Alternative-Endpoint": deprecationInfo.alternative,
          },
        },
      );
    }
  }

  // For v2.2 and below, continue to the actual handler
  return await ctx.next();
}
