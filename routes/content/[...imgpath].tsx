import { Handlers } from "$fresh/server.ts";
import { serverConfig } from "$server/config/config.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getCacheConfig, RouteType } from "$server/services/cacheService.ts";

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

      // Development-only features
      if (imgpath.startsWith("test/") && !isDev) {
        return ResponseUtil.notFound(
          "Test endpoints only available in development",
        );
      }

      const url = new URL(req.url);

      // Determine file type
      const isHtml = imgpath.endsWith(".html");
      const isJs = imgpath.endsWith(".js");
      const isGzip = imgpath.endsWith(".gz");
      const isSvg = imgpath.endsWith(".svg");

      // Get file path
      const filePath = `${serverConfig.APP_ROOT}/static/${imgpath}`;

      try {
        const content = await Deno.readFile(filePath);
        const mimeType = getMimeType(imgpath);

        if (isHtml) {
          const html = new TextDecoder().decode(content);
          const modifiedHtml = html.replace(
            /<head>/i,
            `<head><base href="${url.origin}/">`,
          );

          return ResponseUtil.custom(
            new TextEncoder().encode(modifiedHtml),
            200,
            {
              "Content-Type": "text/html; charset=utf-8",
              "Cache-Control": STATIC_CACHE_CONTROL,
            },
          );
        }

        if (isJs) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": STATIC_CACHE_CONTROL,
          });
        }

        if (isGzip) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "application/gzip",
            "Content-Encoding": "gzip",
            "Cache-Control": STATIC_CACHE_CONTROL,
          });
        }

        if (isSvg) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "image/svg+xml",
            "Cache-Control": STATIC_CACHE_CONTROL,
          });
        }

        return ResponseUtil.custom(content, 200, {
          "Content-Type": mimeType,
          "Cache-Control": STATIC_CACHE_CONTROL,
        });
      } catch (error) {
        console.error(`Error reading file ${filePath}:`, error);
      }

      // If file not found or error, return not-available.png
      const notAvailablePath =
        `${serverConfig.APP_ROOT}/static/not-available.png`;
      const file = await Deno.readFile(notAvailablePath);
      return ResponseUtil.custom(file, 200, {
        "Content-Type": "image/png",
        "Cache-Control": STATIC_CACHE_CONTROL,
      });
    } catch (error) {
      console.error("Error in [...imgpath] handler:", error);
      return ResponseUtil.internalError(error);
    }
  },
};

function getMimeType(filename: string): string {
  const ext = filename.split(".").pop()?.toLowerCase();
  const mimeTypes: Record<string, string> = {
    html: "text/html",
    js: "application/javascript",
    css: "text/css",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    ico: "image/x-icon",
    json: "application/json",
    gz: "application/gzip",
  };

  return mimeTypes[ext || ""] || "application/octet-stream";
}
