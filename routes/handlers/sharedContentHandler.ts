import { FreshContext } from "$fresh/server.ts";
import { getIdentifierType } from "$lib/utils/data/identifiers/identifierUtils.ts";
import { isCpid, isTxHash } from "$lib/utils/typeGuards.ts";
import { logger } from "$lib/utils/logger.ts";
import { getRecursiveHeaders } from "$lib/utils/security/securityHeaders.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";
import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import type { State } from "$types/ui.d.ts";
// import { getBaseUrl } from "$lib/utils/ui/media/imageUtils.ts";
// import { getMimeType } from "$lib/utils/ui/media/imageUtils.ts";

// Define the state type

export async function handleContentRequest(
  identifier: string,
  ctx: FreshContext<State>,
) {
  logger.debug("content", {
    message: "Content request received",
    identifier,
    path: ctx.url.pathname,
    baseUrl: ctx.state.baseUrl,
    env: Deno.env.get("DENO_ENV"),
  });

  const isFullPath = identifier.includes(".") || ctx.url.pathname.includes(".");

  try {
    // Validate identifier based on path type
    if (!isFullPath) {
      const idType = getIdentifierType(identifier);
      const isValidId = isCpid(identifier) ||
        idType === "tx_hash" ||
        idType === "stamp_hash";

      if (!isValidId) {
        logger.debug("content", {
          message: "Invalid identifier",
          identifier,
          idType,
        });
        return WebResponseUtil.stampNotFound();
      }
    } else {
      // Extract the base identifier without extension
      const [id] = identifier.split(".");
      if (!isTxHash(id)) {
        return WebResponseUtil.stampNotFound();
      }
    }

    // For /content/ routes, we need to determine the proper file extension
    // First, try to get stamp info to determine the correct URL
    const response = await StampController.getStampFile(
      identifier,
      RouteType.STAMP_DETAIL,
      ctx.state.baseUrl,
      isFullPath,
    );

    // Check if this is a redirect response
    if (response.status === 302 || response.status === 301) {
      const location = response.headers.get("location");

      // For HTML files, we need to fetch and process the content
      // to avoid Cloudflare's CDN-level Rocket Loader transformation
      if (location && identifier.toLowerCase().endsWith(".html")) {
        try {
          // Fetch the content from the CDN location
          const contentResponse = await fetch(location);
          if (contentResponse.ok) {
            let htmlContent = await contentResponse.text();

            // Regex to find the specific inline script and capture its parts
            const dudkoScriptRegex =
              /(\s*<script[^>]*>\s*let\s+dudko\s*=\s*)(\[.*\])(\s*,\s*maxWidth\s*=\s*)(\d+)(\s*,\s*maxHeight\s*=\s*)(\d+)(\s*,\s*backgroundColor\s*=\s*['"])([0-9a-fA-F]{3,8})(['"]\s*;?\s*<\/script>)/is;
            const dudkoMatch = htmlContent.match(dudkoScriptRegex);

            if (dudkoMatch) {
              const originalFullScriptTag = dudkoMatch[0];
              const dudkoArrayDefinition = dudkoMatch[2]; // Capture dudko array string
              const maxWidthValue = dudkoMatch[4];
              const maxHeightValue = dudkoMatch[6];
              const backgroundColorValue = dudkoMatch[8];

              // Construct the new script content for the head
              const newHeadScriptContent =
                `window.maxWidth=${maxWidthValue}; window.maxHeight=${maxHeightValue}; window.backgroundColor='${backgroundColorValue}'; let dudko=${dudkoArrayDefinition};`;
              const newHeadScriptTag =
                `<script>${newHeadScriptContent}</script>`;

              // Remove the original script tag from its place
              htmlContent = htmlContent.replace(originalFullScriptTag, "");

              // Prepend the new script to the head
              htmlContent = htmlContent.replace(
                /(<head[^>]*>)/i,
                `$1${newHeadScriptTag}`,
              );
            } else {
              // Fallback or logging if the specific dudko script isn't found, try previous broader injection
              const inlineScriptRegex =
                /<script[^>]*>\s*let\s+dudko\s*=\s*.*?,\s*maxWidth\s*=\s*(\d+),\s*maxHeight\s*=\s*(\d+),\s*backgroundColor\s*=\s*'([0-9a-fA-F]{3,8})';?\s*<\/script>/is;
              const matchResult = htmlContent.match(inlineScriptRegex);
              if (matchResult && matchResult.length === 4) {
                const [
                  ,
                  extractedMaxWidth,
                  extractedMaxHeight,
                  extractedBgColor,
                ] = matchResult;
                const injectionScript =
                  `<script>window.maxWidth=${extractedMaxWidth}; window.maxHeight=${extractedMaxHeight}; window.backgroundColor='${extractedBgColor}';</script>`;
                htmlContent = htmlContent.replace(
                  /(<head[^>]*>)/i,
                  `$1${injectionScript}`,
                );
              }
            }

            // Apply comprehensive Cloudflare Rocket Loader fixes to HTML content
            // Step 1: Fix ALL script tags - remove any Cloudflare mangling
            htmlContent = htmlContent.replace(
              /(<script[^>]*?)>/g,
              (_match, openingTagInnerContentAndAttributes) => {
                let tag = openingTagInnerContentAndAttributes;

                // Remove ALL Cloudflare type manglings - any hex prefix before -text/javascript
                tag = tag.replace(
                  /type\s*=\s*"[a-f0-9]+-text\/javascript"/gi,
                  'type="text/javascript"',
                );

                // Remove data-cf-settings attributes that Cloudflare adds
                tag = tag.replace(
                  /data-cf-settings\s*=\s*"[^"]*"/gi,
                  "",
                );

                // Remove defer attributes from rocket-loader scripts
                tag = tag.replace(
                  /\s+defer(?:\s*=\s*["']?defer["']?)?/gi,
                  "",
                );

                // Add data-cfasync="false" to prevent any Rocket Loader processing
                // but not for cdn-cgi scripts which we'll remove entirely
                if (
                  !tag.includes("data-cfasync") && !tag.includes("/cdn-cgi/")
                ) {
                  tag += ' data-cfasync="false"';
                }

                return tag + ">";
              },
            );

            // Step 2: Remove ALL Cloudflare Rocket Loader injected script tags
            // This includes the rocket-loader script itself which may have mangled attributes
            htmlContent = htmlContent.replace(
              /<script[^>]*\/cdn-cgi\/scripts\/[^>]*rocket-loader[^>]*>[^<]*<\/script>/gi,
              "",
            );

            // Also remove any script with mangled type that loads rocket-loader
            htmlContent = htmlContent.replace(
              /<script[^>]*type="[a-f0-9]{8,}-text\/javascript"[^>]*src="[^"]*rocket-loader[^"]*"[^>]*><\/script>/gi,
              "",
            );

            // Step 3: Remove any remaining Cloudflare Rocket Loader references
            htmlContent = htmlContent.replace(
              /data-cf-beacon=["'][^"']*["']/gi,
              "",
            );

            // Step 4: Clean up any malformed script src attributes with encoded quotes
            htmlContent = htmlContent.replace(
              /src=["']([^"']*%22[^"']*)["']/gi,
              (_match, srcValue) => {
                // Decode any URL-encoded quotes and fix malformed paths
                const cleanSrc = srcValue.replace(/%22/g, "");
                return `src="${cleanSrc}"`;
              },
            );

            // Use the standardized HTML response method with headers to prevent CDN modifications
            const recursiveHeaders = getRecursiveHeaders();
            return WebResponseUtil.htmlResponse(htmlContent, {
              headers: {
                ...Object.fromEntries(recursiveHeaders),
                // Add headers to prevent Cloudflare from modifying the response
                "CF-Cache-Level": "bypass",
                "Cache-Control": "no-transform",
                "X-Frame-Options": "SAMEORIGIN",
                "X-Content-Type-Options": "nosniff",
                "X-Content-Transformed": "true",
              },
            });
          }
        } catch (error) {
          logger.error("content", {
            message: "Error fetching HTML content from redirect",
            identifier,
            location,
            error: error instanceof Error ? error.message : String(error),
          });
        }
      }
      // Return the redirect response for non-HTML files
      return response;
    }

    // For non-HTML or non-redirect responses, preserve as-is
    return response;
  } catch (error) {
    logger.error("content", {
      message: "Content handler error",
      identifier,
      error: error instanceof Error ? error.message : String(error),
      path: ctx.url.pathname,
    });
    return WebResponseUtil.stampNotFound();
  }
}

// Export is already done in function declaration above

// Add default export for Fresh manifest compatibility - dummy handler
export default function () {
  return WebResponseUtil.success("OK", {
    headers: { "Content-Type": "text/plain" },
  });
}
