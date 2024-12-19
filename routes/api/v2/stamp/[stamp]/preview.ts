import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import puppeteer from "https://deno.land/x/puppeteer@16.2.0/mod.ts";

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

      // If it's already an image (not HTML/SVG), redirect to original
      if (
        stamp_mimetype?.startsWith("image/") &&
        stamp_mimetype !== "image/svg+xml"
      ) {
        return new Response(null, {
          status: 302,
          headers: { Location: stamp_url },
        });
      }

      // Launch headless browser
      const browser = await puppeteer.launch({
        headless: true,
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        const page = await browser.newPage();
        await page.setViewport({ width: 1200, height: 1200 });
        await page.goto(stamp_url, {
          waitUntil: "networkidle0",
          timeout: 10000,
        });

        // For HTML content, wait for any animations
        if (stamp_mimetype === "text/html") {
          await new Promise((r) => setTimeout(r, 1000));
        }

        const screenshot = await page.screenshot({
          type: "webp",
          quality: 90,
          fullPage: false,
          clip: { x: 0, y: 0, width: 1200, height: 1200 },
        });

        return new Response(screenshot, {
          headers: {
            "Content-Type": "image/webp",
            "Cache-Control": "public, max-age=31536000",
          },
        });
      } finally {
        await browser.close();
      }
    } catch (error) {
      console.error("Preview generation error:", error);
      return new Response(null, {
        status: 302,
        headers: { Location: "/static/images/default-preview.png" },
      });
    }
  },
};
