/**
 * Cloudflare Browser Rendering Worker for Bitcoin Stamps preview generation.
 *
 * Accepts POST requests with either a URL or raw HTML to render as PNG.
 * Uses Cloudflare's Browser Rendering binding (headless Chrome at edge).
 *
 * Authentication: shared secret via Authorization header.
 *
 * Request body (JSON):
 *   { url: string }           - Navigate to URL and screenshot
 *   { html: string }          - Set page content directly and screenshot
 *   { viewport: { width, height } }  - Optional, defaults to 1200x1200
 *   { delay: number }         - Optional ms to wait after load, defaults to 5000
 *
 * Response: PNG binary (image/png) on success, JSON error on failure.
 */

import puppeteer from "@cloudflare/puppeteer";

interface Env {
  BROWSER: Fetcher;
  PREVIEW_AUTH_SECRET: string;
}

interface RenderRequest {
  url?: string;
  html?: string;
  viewport?: { width: number; height: number };
  delay?: number;
}

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    // Only accept POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Authenticate
    const authHeader = request.headers.get("Authorization");
    if (!env.PREVIEW_AUTH_SECRET || authHeader !== `Bearer ${env.PREVIEW_AUTH_SECRET}`) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    let body: RenderRequest;
    try {
      body = await request.json() as RenderRequest;
    } catch {
      return new Response(JSON.stringify({ error: "Invalid JSON body" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    if (!body.url && !body.html) {
      return new Response(
        JSON.stringify({ error: "Request must include 'url' or 'html'" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const viewportWidth = body.viewport?.width || 1200;
    const viewportHeight = body.viewport?.height || 1200;
    const delay = body.delay ?? 5000;

    let browser;
    let usedTieredFallback = false;
    try {
      browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();

      await page.setViewport({
        width: viewportWidth,
        height: viewportHeight,
        deviceScaleFactor: 1,
      });

      if (body.html) {
        // HTML mode: set content directly (no network needed — keep tight timeout)
        await page.setContent(body.html, {
          waitUntil: "networkidle0",
          timeout: 25000,
        });
      } else if (body.url) {
        // URL mode: tiered-timeout approach for maximum reliability.
        // Some stamps (Append framework, complex recursive) keep network connections
        // alive indefinitely, causing networkidle2 to hang until timeout.
        // Strategy: try networkidle2 with 20s timeout first. If it times out,
        // the page content is already loaded — just wait a bit longer for
        // rendering to complete, then screenshot anyway.
        try {
          await page.goto(body.url, {
            waitUntil: "networkidle2",
            timeout: 20000,
          });
        } catch (navError) {
          const navMsg = navError instanceof Error ? navError.message : String(navError);
          if (navMsg.includes("timeout") || navMsg.includes("Timeout")) {
            // Page loaded but network didn't settle — content is likely rendered.
            // Wait for rendering to complete before screenshot.
            console.log(
              `[stamp-preview-renderer] networkidle2 timed out for ${body.url} — proceeding with extended delay`,
            );
            await new Promise((resolve) => setTimeout(resolve, 12000));
            usedTieredFallback = true;
          } else {
            // Genuine navigation error (DNS, SSL, 404, etc.) — re-throw
            throw navError;
          }
        }
      }

      // Wait for dynamic content (animations, canvas rendering, etc.)
      if (delay > 0) {
        await new Promise((resolve) => setTimeout(resolve, delay));
      }

      // Take screenshot with transparent background
      const screenshot = await page.screenshot({
        type: "png",
        fullPage: false,
        omitBackground: true,
        clip: { x: 0, y: 0, width: viewportWidth, height: viewportHeight },
      });

      return new Response(screenshot, {
        status: 200,
        headers: {
          "Content-Type": "image/png",
          "X-Rendering-Engine": "cloudflare-browser",
          ...(usedTieredFallback && { "X-Tiered-Fallback": "true" }),
          "Cache-Control": "no-store",
        },
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      console.error("[stamp-preview-renderer] Render error:", message);

      return new Response(
        JSON.stringify({ error: "Render failed", detail: message }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  },
};
