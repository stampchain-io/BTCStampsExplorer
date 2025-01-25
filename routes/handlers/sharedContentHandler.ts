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
import { getRecursiveHeaders } from "$lib/utils/securityHeaders.ts";

// Define the state type
interface State {
  baseUrl: string;
}

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

      // Add data-cfasync="false" to script tags that load recursive content
      const modifiedHtml = html.replace(
        /<script([^>]*?)src="\/s\/([A-Z0-9]+)"([^>]*?)>/g,
        '<script$1src="/s/$2"$3 data-cfasync="false">',
      );

      // Use the recursive headers which include appropriate CSP and cache settings
      const headers = {
        ...Object.fromEntries(response.headers),
        ...getRecursiveHeaders(),
        "Content-Type": "text/html; charset=utf-8",
      };

      return new Response(modifiedHtml, {
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
