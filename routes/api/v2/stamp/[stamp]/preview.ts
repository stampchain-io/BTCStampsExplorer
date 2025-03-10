import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import { render as renderSvg } from "https://deno.land/x/resvg_wasm@0.2.0/mod.ts";
import { DOMParser } from "jsr:@b-fuze/deno-dom";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { stamp } = ctx.params;

      // Get stamp details
      const stampData = await StampController.getStampDetailsById(stamp);
      if (!stampData?.data?.stamp) {
        return new Response("Stamp not found", { status: 404 });
      }

      const { stamp_url, stamp_mimetype } = stampData.data.stamp;

      // If it's already an image (PNG, JPEG, etc.), redirect to the original
      if (stamp_mimetype?.startsWith("image/") && stamp_mimetype !== "image/svg+xml") {
        return new Response(null, {
          status: 302,
          headers: { Location: stamp_url },
        });
      }

      // Fetch the HTML or SVG content
      const response = await fetch(stamp_url);
      if (!response.ok) {
        return new Response("Failed to fetch stamp", { status: 400 });
      }
      const content = await response.text();

      // Handle SVG to PNG conversion
      if (stamp_mimetype === "image/svg+xml") {
        const pngBuffer = await renderSvg(content);
        return new Response(pngBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000",
          },
        });
      }

      // Handle HTML to PNG conversion
      if (stamp_mimetype === "text/html") {
        const pngBuffer = await convertHtmlToPng(content);
        return new Response(pngBuffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000",
          },
        });
      }

      return new Response("Unsupported media type", { status: 415 });

    } catch (error) {
      console.error("Preview generation error:", error);
      return new Response(null, {
        status: 302,
        headers: { Location: "/static/images/default-preview.png" },
      });
    }
  },
};

// Convert HTML to SVG, then render PNG
function htmlToSvg(html: string): string {
  const doc = new DOMParser().parseFromString(html, "text/html");
  if (!doc) {
    throw new Error("Failed to parse HTML.");
  }

  const bodyContent = doc.body.innerHTML.trim();
  
  return `<?xml version="1.0" encoding="UTF-8"?>
  <svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="800" height="600">
    <!-- Background -->
    <rect width="100%" height="100%" fill="white"></rect>

    <!-- Render HTML inside foreignObject -->
    <foreignObject x="0" y="0" width="800" height="600">
      <body xmlns="http://www.w3.org/1999/xhtml">
        <div style="
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          text-align: center;
          font-family: Arial, sans-serif;
          font-size: 20px;
          color: black;
          background-color: white;
        ">
          ${bodyContent}
        </div>
      </body>
    </foreignObject>
  </svg>`;
}


async function convertHtmlToPng(html: string): Promise<Uint8Array> {
  const svgString = htmlToSvg(html);
  return await renderSvg(svgString);
}