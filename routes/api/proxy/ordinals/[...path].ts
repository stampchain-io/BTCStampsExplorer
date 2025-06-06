import { FreshContext } from "$fresh/server.ts";

export const handler = async (
  _req: Request,
  ctx: FreshContext,
): Promise<Response> => {
  const { path } = ctx.params;
  const pathArray = Array.isArray(path) ? path : [path];
  const fullPath = pathArray.join("/");

  // Construct the ordinals.com URL
  const ordinalsUrl = `https://ordinals.com/content/${fullPath}`;

  try {
    // Fetch from ordinals.com
    const response = await fetch(ordinalsUrl);

    if (!response.ok) {
      return new Response("Not Found", { status: 404 });
    }

    // Get the content and headers
    const content = await response.arrayBuffer();
    const contentType = response.headers.get("content-type") ||
      "application/octet-stream";

    // Return with appropriate headers
    return new Response(content, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, HEAD, OPTIONS",
        "Access-Control-Allow-Headers":
          "Content-Type, Accept, Origin, Authorization",
      },
    });
  } catch (error) {
    console.error("Error proxying ordinals content:", error);
    return new Response("Internal Server Error", { status: 500 });
  }
};
