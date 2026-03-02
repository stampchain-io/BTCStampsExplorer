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
 *   { frames: number }        - Optional number of frames to capture, defaults to 1
 *   { frameInterval: number } - Optional ms between frame captures, defaults to 100
 *
 * Response:
 *   frames === 1 (default): PNG binary (image/png)
 *   frames > 1:             JSON { frames: string[] } with base64-encoded PNGs
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
  frames?: number;
  frameInterval?: number;
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
    const frames = body.frames ?? 1;
    const frameInterval = body.frameInterval ?? 100;

    // Multi-frame mode uses a fixed 400x400 viewport for GIF frame capture.
    const effectiveViewportWidth = frames > 1 ? 400 : viewportWidth;
    const effectiveViewportHeight = frames > 1 ? 400 : viewportHeight;

    let browser;
    let usedTieredFallback = false;
    try {
      browser = await puppeteer.launch(env.BROWSER);
      const page = await browser.newPage();

      await page.setViewport({
        width: effectiveViewportWidth,
        height: effectiveViewportHeight,
        deviceScaleFactor: 1,
      });

      if (body.html) {
        // HTML mode: set content directly. Use tiered timeout like URL mode —
        // some stamps with CSS animations and embedded fonts prevent networkidle0
        // from resolving even though no real network requests are made.
        try {
          await page.setContent(body.html, {
            waitUntil: "networkidle0",
            timeout: 15000,
          });
        } catch (htmlNavError) {
          const htmlNavMsg = htmlNavError instanceof Error
            ? htmlNavError.message
            : String(htmlNavError);
          if (htmlNavMsg.includes("timeout") || htmlNavMsg.includes("Timeout")) {
            console.log(
              `[stamp-preview-renderer] networkidle0 timed out for inline HTML — proceeding with extended delay`,
            );
            await new Promise((resolve) => setTimeout(resolve, 8000));
            usedTieredFallback = true;
          } else {
            throw htmlNavError;
          }
        }
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

      if (frames > 1) {
        // Multi-frame capture mode: collect N screenshots for animated GIF generation.
        // Viewport is fixed at 400x400 (set before navigation above).
        const capturedFrames: string[] = [];
        for (let i = 0; i < frames; i++) {
          if (i > 0) {
            await new Promise((r) => setTimeout(r, frameInterval));
          }
          const screenshot = await page.screenshot({
            type: "png",
            fullPage: false,
            omitBackground: true,
            clip: { x: 0, y: 0, width: 400, height: 400 },
          });
          capturedFrames.push(Buffer.from(screenshot).toString("base64"));
        }

        return new Response(JSON.stringify({ frames: capturedFrames }), {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "X-Rendering-Engine": "cloudflare-browser",
            "Cache-Control": "no-store",
          },
        });
      }

      // Single-frame path (frames === 1, default): unchanged behavior.
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
