import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";
import puppeteer from "npm:puppeteer";

export const handler: Handlers = {
  async GET(req, ctx) {
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
        headless: "new",
        args: ["--no-sandbox", "--disable-setuid-sandbox"],
      });

      try {
        const page = await browser.newPage();

        // Set viewport size to square dimensions
        // Using 1200x1200 for high quality, can be adjusted if needed
        await page.setViewport({
          width: 1200,
          height: 1200,
          deviceScaleFactor: 1,
        });

        // Load the stamp content
        await page.goto(stamp_url, {
          waitUntil: "networkidle0",
          timeout: 10000,
        });

        // For HTML content, wait for any animations/renders
        if (stamp_mimetype === "text/html") {
          await new Promise((resolve) => setTimeout(resolve, 1000));
        }

        // Take screenshot
        const screenshot = await page.screenshot({
          type: "webp",
          quality: 90,
          encoding: "binary",
          fullPage: false,
          clip: {
            x: 0,
            y: 0,
            width: 1200,
            height: 1200,
          },
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

      // Return a default preview image on error
      return new Response(null, {
        status: 302,
        headers: {
          Location: "/static/images/default-preview.png",
        },
      });
    }
  },
};
