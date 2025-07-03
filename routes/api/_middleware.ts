import { FreshContext } from "$fresh/server.ts";
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
  // Store request in context for middleware
  ctx.req = req;

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
          const data = await clonedResponse.json();
          const transformed = transformResponseForVersion(
            data,
            ctx.state.apiVersion,
          );

          // Create new response with transformed data and all headers
          const newHeaders = new Headers(response.headers);

          // Add version-specific headers
          newHeaders.set("API-Version", ctx.state.apiVersion);

          if (ctx.state.versionContext) {
            const { isDeprecated, endOfLife } = ctx.state.versionContext;

            if (isDeprecated) {
              newHeaders.set("Deprecation", "true");
              newHeaders.set("Sunset", endOfLife || "");
              newHeaders.set(
                "Link",
                `<https://stampchain.io/docs/api/migration>; rel="deprecation"`,
              );
            }
          }

          return new Response(JSON.stringify(transformed), {
            status: response.status,
            statusText: response.statusText,
            headers: newHeaders,
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
