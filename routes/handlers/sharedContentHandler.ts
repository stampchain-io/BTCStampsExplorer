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
      response.headers.get("content-type")?.toLowerCase().includes("html")
    ) {
      const html = await response.text();

      // Serve as "text/plain" to avoid Rocket Loader completely
      const headers = {
        ...Object.fromEntries(response.headers),
        "Content-Type": "text/plain",
        "X-Original-Content-Type": "text/html",
        "Cache-Control": "public, max-age=2592000, immutable",
        "CDN-Cache-Control": "public, max-age=2592000, immutable",
        "Surrogate-Control": "public, max-age=2592000, immutable",
      };

      // Add script to correct content type client-side
      const finalHtml = `
        <script>
          document.contentType = 'text/html; charset=utf-8';
          document.querySelector('html').innerHTML = document.querySelector('body').textContent;
        </script>
        ${html}
      `;

      return new Response(finalHtml, {
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
