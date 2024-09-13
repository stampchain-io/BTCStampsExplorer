import { Handlers } from "$fresh/server.ts";
import { getMimeType } from "utils/util.ts";
import { serverConfig } from "$server/config/config.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { imgpath } = ctx.params;
    return await serveImage(imgpath);
  },
};

async function serveImage(imgpath: string): Promise<Response> {
  const mimeType = getMimeType(imgpath.split(".").pop() as string);

  // First, check if the file exists in IMAGES_SRC_PATH
  if (serverConfig.IMAGES_SRC_PATH) {
    const remotePath = `${serverConfig.IMAGES_SRC_PATH}/${imgpath}`;
    try {
      const response = await fetch(remotePath);
      if (response.ok) {
        const file = await response.arrayBuffer();
        return new Response(file, {
          status: 200,
          headers: {
            "Content-Type": mimeType,
          },
        });
      }
    } catch (error) {
      console.error(`Error fetching from IMAGES_SRC_PATH: ${error}`);
    }
  }

  // If not found in IMAGES_SRC_PATH or if IMAGES_SRC_PATH is not set, check local path
  const localPath = `${serverConfig.APP_ROOT}/static/${imgpath}`;
  try {
    const file = await Deno.readFile(localPath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
      },
    });
  } catch (error) {
    console.error(`Error reading local file: ${error}`);
  }

  // If file is not found in either location, serve the not-available image
  return await serveNotAvailableImage();
}

async function serveNotAvailableImage(): Promise<Response> {
  try {
    const notAvailablePath =
      `${serverConfig.APP_ROOT}/static/not-available.png`;
    const file = await Deno.readFile(notAvailablePath);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": "image/png",
      },
    });
  } catch (error) {
    console.error(`Error reading not-available image: ${error}`);
    return new Response("Image not found", { status: 404 });
  }
}
