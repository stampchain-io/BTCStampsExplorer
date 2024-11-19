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
  const mimeType = getMimeType(imgpath.split(".").pop() as string);
  const isHtml = mimeType === "text/html";
  const isDev = Deno.env.get("DENO_ENV") === "development";

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
          });
        }

        return ResponseUtil.custom(content, 200, {
          "Content-Type": mimeType,
          "Cache-Control": isDev
            ? "no-store, must-revalidate"
            : "public, max-age=36000",
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
    });
  } catch (error) {
    return ResponseUtil.handleError(
      error,
      "Error serving fallback image",
    );
  }
}
