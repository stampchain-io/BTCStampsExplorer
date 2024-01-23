import { HandlerContext } from "$fresh/server.ts";
import { getMimeType } from "$lib/utils/util.ts";
import { conf } from "../../lib/utils/config.ts";

export async function handler(
  req: Request,
  ctx: HandlerContext,
): Promise<Response> {
  const { imgpath } = ctx.params;
  let path;
  const mimeType = getMimeType(imgpath.split(".").pop() as string);

  if (conf.IMAGES_SRC_PATH !== "") {
    path = `${conf.IMAGES_SRC_PATH}/${imgpath}`;
    try {
      const file = await fetch(path);
      if (!file.ok) throw new Error(`File ${imgpath} not found in IMAGES_SRC_PATH`);
      const content = await file.arrayBuffer();
      return new Response(content, {
        status: 200,
        headers: {
          "Content-Type": mimeType,
        },
      });
    } catch (error) {
      console.error(error);
      path = `${Deno.cwd()}/static/stamps/${imgpath}`;
    }
  }

  if (!path || path === "") {
    path = imgpath === "not-available.png"
      ? `${Deno.cwd()}/static/${imgpath}`
      : `${Deno.cwd()}/static/stamps/${imgpath}`;
  }
  try {
    const file = await Deno.readFile(path);
    return new Response(file, {
      status: 200,
      headers: {
        "Content-Type": mimeType,
      },
    });
  } catch (error) {
    console.error(error);
    return new Response("File not found", { status: 404 });
  }
}
