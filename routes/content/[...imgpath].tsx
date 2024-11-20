import { Handlers } from "$fresh/server.ts";
import { getMimeType } from "$lib/utils/imageUtils.ts";
import { serverConfig } from "$server/config/config.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { imgpath } = ctx.params;

    // Development-only features
    if (
      imgpath.startsWith("test/") && Deno.env.get("DENO_ENV") !== "development"
    ) {
      return ResponseUtil.error(
        "Test endpoints only available in development",
        404,
      );
    }

    return await serveImage(imgpath);
  },
};

async function serveImage(imgpath: string): Promise<Response> {
  const extension = imgpath.split(".").pop()?.toLowerCase() || "";

  // Direct extension checks for specific handling
  const isHtml = extension === "html" || extension === "htm";
  const isJs = extension === "js" || extension === "mjs" || extension === "cjs";
  const isGzip = extension === "gz" || extension === "gzip";
  const isSvg = extension === "svg" || extension === "svgz";
  const isDev = Deno.env.get("DENO_ENV") === "development";

  // Basic MIME type mapping for Content-Type header
  const mimeType = {
    html: "text/html",
    htm: "text/html",
    js: "application/javascript",
    mjs: "application/javascript",
    cjs: "application/javascript",
    gz: "application/gzip",
    gzip: "application/gzip",
    svg: "image/svg+xml",
    svgz: "image/svg+xml",
  }[extension] || getMimeType(extension); // Fallback to full mapping for other types

  if (serverConfig.IMAGES_SRC_PATH) {
    const remotePath = `${serverConfig.IMAGES_SRC_PATH}/${imgpath}`;
    try {
      const response = await fetch(remotePath);
      if (response.ok) {
        const content = await response.arrayBuffer();

        if (isHtml) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "text/html; charset=utf-8",
            "Cache-Control": "no-store, must-revalidate",
            "CF-Features": "rocketLoader=off",
            "X-XSS-Protection": "1; mode=block",
            "X-Frame-Options": "SAMEORIGIN",
            "Permissions-Policy": isDev
              ? "" // No restrictions in dev
              : "camera=(), geolocation=(), microphone=(), payment=(), usb=(), interest-cohort=()",
            "Content-Security-Policy":
              "default-src 'self' 'unsafe-inline' 'unsafe-eval' data: blob: https://dev.bitcoinstamps.xyz;" +
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' blob: data: https://dev.bitcoinstamps.xyz https://dev.bitcoinstamps.xyz/cdn-cgi/speculation;" +
              "style-src 'self' 'unsafe-inline' https://dev.bitcoinstamps.xyz;" +
              "frame-src 'self' data: blob: https://dev.bitcoinstamps.xyz;" +
              "child-src 'self' blob: data:;" +
              "worker-src 'self' blob:;",
            "Vary": "Accept-Encoding",
          });
        }

        if (isJs) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "application/javascript; charset=utf-8",
            "Cache-Control": isDev
              ? "no-store, must-revalidate"
              : "public, max-age=3600",
            "Vary": "Accept-Encoding",
          });
        }

        if (isGzip) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "application/gzip",
            "Content-Encoding": "gzip",
            "Cache-Control": isDev
              ? "no-store, must-revalidate"
              : "public, max-age=3600",
            "Accept-Ranges": "bytes",
            "Vary": "Accept-Encoding",
          });
        }

        if (isSvg) {
          return ResponseUtil.custom(content, 200, {
            "Content-Type": "image/svg+xml",
            "Cache-Control": isDev
              ? "no-store, must-revalidate"
              : "public, max-age=3600",
            "Content-Security-Policy": isDev
              ? "default-src 'self' data: blob: *; img-src 'self' data: blob: *;"
              : "default-src 'self' data: blob:; img-src 'self' data: blob:;",
            "Vary": "Accept-Encoding",
          });
        }

        return ResponseUtil.custom(content, 200, {
          "Content-Type": mimeType,
          "Cache-Control": isDev
            ? "no-store, must-revalidate"
            : "public, max-age=3600",
          "Vary": "Accept-Encoding",
        });
      }
    } catch (error) {
      return ResponseUtil.handleError(
        error,
        `Error fetching from IMAGES_SRC_PATH: ${imgpath}`,
      );
    }
  }

  return await serveNotAvailableImage();
}

async function serveNotAvailableImage(): Promise<Response> {
  const isDev = Deno.env.get("DENO_ENV") === "development";

  try {
    const notAvailablePath =
      `${serverConfig.APP_ROOT}/static/not-available.png`;
    const file = await Deno.readFile(notAvailablePath);
    return ResponseUtil.custom(file, 200, {
      "Content-Type": "image/png",
      "Cache-Control": isDev
        ? "no-store, must-revalidate"
        : "public, max-age=3600",
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Access-Control-Allow-Origin": "*",
      "Vary": "Accept-Encoding",
    });
  } catch (error) {
    return ResponseUtil.handleError(
      error,
      "Error serving fallback image",
    );
  }
}
