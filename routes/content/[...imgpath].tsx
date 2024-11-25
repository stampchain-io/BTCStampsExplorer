import { Handlers } from "$fresh/server.ts";
import { serverConfig } from "$server/config/config.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";
import { getMimeType, NOT_AVAILABLE_IMAGE } from "$lib/utils/imageUtils.ts";

const isDev = Deno.env.get("DENO_ENV") === "development";

// Get cache configuration for static content
const { duration, staleWhileRevalidate } = getCacheConfig(RouteType.STATIC);
const STATIC_CACHE_CONTROL = isDev
  ? "no-store, must-revalidate"
  : `public, max-age=${duration}, stale-while-revalidate=${staleWhileRevalidate}`;

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { imgpath } = ctx.params;

      if (imgpath.startsWith("test/")) {
        return ResponseUtil.notFound(
          "Test endpoints only available in development",
        );
      }

      const url = new URL(req.url);
      let content: ArrayBuffer | null = null;
      const mimeType = getMimeType(
        imgpath.split(".").pop()?.toLowerCase() || "",
      );

      // Try remote IMAGES_SRC_PATH first
      if (serverConfig.IMAGES_SRC_PATH) {
        try {
          const remotePath = `${serverConfig.IMAGES_SRC_PATH}/${imgpath}`;
          const response = await fetch(remotePath);
          if (response.ok) {
            content = await response.arrayBuffer();
          }
        } catch (error) {
          console.debug(`Remote fetch failed: ${error}`);
        }
      }

      // If remote fetch failed, try local static directory
      if (!content) {
        try {
          const filePath = `${serverConfig.APP_ROOT}/static/${imgpath}`;
          content = await Deno.readFile(filePath);
        } catch (error) {
          console.debug(`Local file read failed: ${error}`);
        }
      }

      // If content was found, serve it with appropriate headers
      if (content) {
        switch (mimeType) {
          case "text/html": {
            return ResponseUtil.custom(content, 200, {
              "Content-Type": `${mimeType}; charset=utf-8`,
              "Cache-Control": STATIC_CACHE_CONTROL,
            });
          }

          case "application/javascript": {
            return ResponseUtil.custom(content, 200, {
              "Content-Type": `${mimeType}; charset=utf-8`,
              "Cache-Control": STATIC_CACHE_CONTROL,
              "Vary": "Accept-Encoding",
            });
          }

          case "application/gzip": {
            return ResponseUtil.custom(content, 200, {
              "Content-Type": mimeType,
              "Content-Encoding": "gzip",
              "Cache-Control": STATIC_CACHE_CONTROL,
              "Accept-Ranges": "bytes",
              "Vary": "Accept-Encoding",
            });
          }

          case "image/svg+xml": {
            return ResponseUtil.custom(content, 200, {
              "Content-Type": mimeType,
              "Cache-Control": STATIC_CACHE_CONTROL,
              "Vary": "Accept-Encoding",
            });
          }

          default: {
            return ResponseUtil.custom(content, 200, {
              "Content-Type": mimeType,
              "Cache-Control": STATIC_CACHE_CONTROL,
              "Vary": "Accept-Encoding",
            });
          }
        }
      }

      // Fallback to not-available.png
      const notAvailablePath =
        `${serverConfig.APP_ROOT}/static${NOT_AVAILABLE_IMAGE}`;
      const fallbackContent = await Deno.readFile(notAvailablePath);
      return ResponseUtil.custom(fallbackContent, 200, {
        "Content-Type": "image/png",
        "Cache-Control": STATIC_CACHE_CONTROL,
        "Vary": "Accept-Encoding",
      });
    } catch (error) {
      console.error("Error in [...imgpath] handler:", error);
      return ResponseUtil.internalError(error);
    }
  },
};
