import { HandlerContext } from "$fresh/server.ts";
import { getMimeType } from "utils/util.ts";
import { conf } from "utils/config.ts";

export async function handler(
  req: Request,
  ctx: HandlerContext,
): Promise<Response> {
  const { imgpath } = ctx.params;
  const mimeType = getMimeType(imgpath.split(".").pop() as string);

  // First, check if the file exists in IMAGES_SRC_PATH
  if (conf.IMAGES_SRC_PATH !== "") {
    const remotePath = `${conf.IMAGES_SRC_PATH}/${imgpath}`;
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
  const localPath = `${Deno.cwd()}/static/${imgpath}`;
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
  try {
    const notAvailablePath = `${Deno.cwd()}/static/not-available.png`;
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
