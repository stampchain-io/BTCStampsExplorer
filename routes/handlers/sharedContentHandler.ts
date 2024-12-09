import { StampController } from "$server/controller/stampController.ts";
import { RouteType } from "$server/services/cacheService.ts";
import { logger } from "$lib/utils/logger.ts";
import {
  getIdentifierType,
  isCpid,
  isTxHash,
} from "$lib/utils/identifierUtils.ts";
import { WebResponseUtil } from "$lib/utils/webResponseUtil.ts";
import { FreshContext } from "$fresh/server.ts";
import { API_RESPONSE_VERSION } from "$lib/utils/responseUtil.ts";
import { normalizeHeaders } from "$lib/utils/headerUtils.ts";

export async function handleContentRequest(
  identifier: string,
  ctx: FreshContext,
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

    const response = await StampController.getStampFile(
      identifier,
      RouteType.STAMP_DETAIL,
      ctx.state.baseUrl,
      isFullPath,
    );

    if (
      response.headers.get("content-type")?.toLowerCase().includes("text/html")
    ) {
      const html = await response.text();

      // Clean up the HTML before sending to client
      const cleanedHtml = html
        // Remove Rocket Loader's type modification but preserve the src
        .replace(
          /<script src="(\/s\/[A-Z0-9]+)"[^>]*>/g,
          '<script src="$1">',
        )
        // Clean up inline scripts (these we know are JavaScript)
        .replace(
          /<script type="[a-f0-9]+-text\/javascript">/g,
          "<script>",
        )
        // Remove Rocket Loader's script if present
        .replace(
          /<script src="\/cdn-cgi\/scripts\/.*?rocket-loader\.min\.js".*?><\/script>/g,
          "",
        );
      // Preserve existing headers but ensure version headers are present
      const headers = {
        ...Object.fromEntries(response.headers),
        "Content-Type": "text/html",
        "Cache-Control": "public, max-age=2592000, immutable",
        "CDN-Cache-Control": "public, max-age=2592000, immutable",
        "Surrogate-Control": "public, max-age=2592000, immutable",
        "X-Content-Transformed": "true",
        "X-API-Version": API_RESPONSE_VERSION,
      };

      return new Response(cleanedHtml, {
        headers: normalizeHeaders(headers),
      });
    }

    // For non-HTML, preserve response but ensure version headers
    return new Response(response.body, {
      headers: normalizeHeaders(response.headers),
    });
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
