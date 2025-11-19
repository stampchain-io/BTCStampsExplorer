import { FreshContext } from "$fresh/server.ts";
import { logger } from "$lib/utils/logger.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { path } = ctx.params;
  const pathArray = Array.isArray(path) ? path : [path];
  const fullPath = pathArray.join("/");

  // Construct the arweave.net URL
  const arweaveUrl = `https://arweave.net/${fullPath}`;

  try {
    // Fetch from arweave.net with User-Agent for monitoring
    const response = await fetch(arweaveUrl, {
      headers: {
        "User-Agent": "BTCStampsExplorer-Arweave-Proxy",
      },
      redirect: "follow", // Follow redirects automatically
    });

    if (!response.ok) {
      logger.warn("content", {
        message: "Arweave content not found",
        url: arweaveUrl,
        status: response.status,
      });
      return WebResponseUtil.notFound("Arweave content not found");
    }

    // Get the content and headers
    const content = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ||
      "application/octet-stream";

    // Convert to Uint8Array for direct response
    const uint8Array = new Uint8Array(content);

    // Return binary content using ApiResponseUtil.custom for proper handling
    return ApiResponseUtil.custom(uint8Array, 200, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Accept, Origin, Authorization",
        "X-Proxy-Source": "arweave.net",
      },
    });
  } catch (error) {
    console.error("Arweave Proxy Error Details:", {
      message: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
      url: arweaveUrl,
      fullPath: fullPath,
    });
    logger.error("content", {
      message: "Error proxying arweave content",
      error: error instanceof Error ? error.message : String(error),
      url: arweaveUrl,
    });
    return WebResponseUtil.internalError(
      error,
      "Failed to proxy Arweave content",
    );
  }
};
