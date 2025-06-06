import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import * as screenshotone from "screenshotone-api-sdk";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { stamp } = ctx.params;
      // Get stamp details
      const stampData = await StampController.getSpecificStamp(stamp);
      if (!stampData?.stamp_url) {
        return new Response("Stamp not found", { status: 404 });
      }

      const { stamp_url, stamp_mimetype } = stampData;

      if (
        stamp_mimetype?.startsWith("image/") &&
        stamp_mimetype !== "image/svg+xml"
      ) {
        return new Response(null, {
          status: 302,
          headers: { Location: stamp_url },
        });
      }

      // For SVGs, try the original URL first (screenshot service may handle it)
      let processedUrl = stamp_url;
      if (stamp_mimetype === "image/svg+xml") {
        // Use the original SVG URL - if it fails, the screenshot service will return an error
        // and social media platforms will fall back to other meta tags
        processedUrl = stamp_url;
      }

      const client = new screenshotone.Client(
        "OUs5bLzPfWlwdQ",
        "WUlkCqVvQdlPxQ",
      );

      const options = screenshotone.TakeOptions.url(processedUrl)
        .delay(3)
        .blockAds(true);

      const url = await client.generateTakeURL(options);

      return new Response(null, {
        status: 302,
        headers: {
          Location: url,
        },
      });
    } catch (error) {
      console.error("Preview generation error:", error);
      return new Response(null, {
        status: 302,
        headers: { Location: "/static/images/default-preview.png" },
      });
    }
  },
};
