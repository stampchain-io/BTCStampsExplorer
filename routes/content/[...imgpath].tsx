import { Handlers } from "$fresh/server.ts";
import { getMimeType } from "$lib/utils/util.ts";
import { serverConfig } from "$server/config/config.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

type SecurityHeaders = Record<string, string>;

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { imgpath } = ctx.params;
    return await serveImage(imgpath);
  },
};

async function serveImage(imgpath: string): Promise<Response> {
  const mimeType = getMimeType(imgpath.split(".").pop() as string);
  const isHtml = mimeType === "text/html";

  const headers: SecurityHeaders = {
    "Content-Type": mimeType,
    "Cache-Control": "public, max-age=3600",
    "X-Content-Type-Options": "nosniff",
  };

  if (isHtml) {
    headers["Content-Security-Policy"] = `default-src 'self'; ` +
      `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com; ` +
      `style-src 'self' 'unsafe-inline'; ` +
      `img-src 'self' data: blob:; ` +
      `connect-src 'self' blob: data: https://static.cloudflareinsights.com; ` +
      `worker-src 'self' blob:; ` +
      `frame-ancestors 'self'; ` +
      `base-uri 'none'; ` +
      `form-action 'none'; ` +
      `media-src 'self' blob:; ` +
      `font-src 'self' data:;`;

    headers["CF-No-Cache"] = "1";
  }

  if (serverConfig.IMAGES_SRC_PATH) {
    const remotePath = `${serverConfig.IMAGES_SRC_PATH}/${imgpath}`;
    try {
      const response = await fetch(remotePath);
      if (response.ok) {
        const content = await response.arrayBuffer();
        return ResponseUtil.custom(content, 200, headers);
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
  try {
    const notAvailablePath =
      `${serverConfig.APP_ROOT}/static/not-available.png`;
    const file = await Deno.readFile(notAvailablePath);
    return ResponseUtil.custom(file, 200, {
      "Content-Type": "image/png",
      "Cache-Control": "public, max-age=3600",
      "X-Content-Type-Options": "nosniff",
    });
  } catch (error) {
    return ResponseUtil.handleError(
      error,
      "Error serving fallback image",
    );
  }
}
