import { Handlers } from "$fresh/server.ts";
import { getMimeType } from "$lib/utils/imageUtils.ts";
import { serverConfig } from "$server/config/config.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { imgpath } = ctx.params;
    return await serveImage(imgpath);
  },
};

async function serveImage(imgpath: string): Promise<Response> {
  const mimeType = getMimeType(imgpath.split(".").pop() as string);

  if (serverConfig.IMAGES_SRC_PATH) {
    const remotePath = `${serverConfig.IMAGES_SRC_PATH}/${imgpath}`;
    try {
      const response = await fetch(remotePath);
      if (response.ok) {
        const content = await response.arrayBuffer();
        return ResponseUtil.custom(content, 200, {
          "Content-Type": mimeType,
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
  try {
    const notAvailablePath =
      `${serverConfig.APP_ROOT}/static/not-available.png`;
    const file = await Deno.readFile(notAvailablePath);
    return ResponseUtil.custom(file, 200, {
      "Content-Type": "image/png",
    });
  } catch (error) {
    return ResponseUtil.handleError(
      error,
      "Error serving fallback image",
    );
  }
}
