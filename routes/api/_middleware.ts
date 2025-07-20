import { FreshContext } from "$fresh/server.ts";
import { ApiResponseUtil } from "../../lib/utils/apiResponseUtil.ts";
import { apiVersionMiddleware } from "../../server/middleware/apiVersionMiddleware.ts";
import { transformResponseForVersion } from "../../server/middleware/schemaTransformer.ts";

/**
 * API-specific middleware
 * Handles API versioning, response transformation, and common API concerns
 */

export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  // Store request in state for middleware
  ctx.state.request = req;

  // Apply API version middleware first
  const versionResponse = await apiVersionMiddleware(ctx, async () => {
    // Continue to next middleware/handler
    const response = await ctx.next();

    // Transform response based on API version
    if (ctx.state.apiVersion && response.ok) {
      try {
        const contentType = response.headers.get("content-type");

        // Only transform JSON responses
        if (contentType?.includes("application/json")) {
          // Clone the response to avoid consuming the body
          const clonedResponse = response.clone();

          // Check if response body is readable
          const reader = clonedResponse.body?.getReader();
          if (!reader) {
            console.warn(
              "Response body is not readable, skipping transformation",
            );
            return response;
          }
          reader.releaseLock();

          // Parse JSON with error handling
          let data;
          try {
            data = await clonedResponse.json();
          } catch (jsonError) {
            console.warn(
              "Failed to parse response as JSON, skipping transformation:",
              jsonError,
            );
            return response;
          }

          const transformed = transformResponseForVersion(
            data,
            ctx.state.apiVersion as string,
          );

          // Create new response with transformed data and all headers
          const newHeaders = new Headers(response.headers);

          // Add version-specific headers
          newHeaders.set("API-Version", ctx.state.apiVersion as string);

          if (
            ctx.state.versionContext &&
            typeof ctx.state.versionContext === "object"
          ) {
            const versionContext = ctx.state.versionContext as {
              isDeprecated?: boolean;
              endOfLife?: string;
            };
            const { isDeprecated, endOfLife } = versionContext;

            if (isDeprecated) {
              newHeaders.set("Deprecation", "true");
              newHeaders.set("Sunset", endOfLife || "");
              newHeaders.set(
                "Link",
                `<https://stampchain.io/docs/api/migration>; rel="deprecation"`,
              );
            }
          }

          return ApiResponseUtil.success(transformed, {
            status: response.status,
            headers: Object.fromEntries(newHeaders),
          });
        }
      } catch (error) {
        console.error("Error transforming response:", error);
        // Return original response on error
        return response;
      }
    }

    return response;
  });

  return versionResponse;
}
