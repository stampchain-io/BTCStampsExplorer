/**
 * Local HTML to PNG rendering using Puppeteer-core with system Chromium
 * Uses npm:puppeteer-core for Deno 2.x compatibility (deno.land/x/puppeteer
 * uses deprecated Deno.run API removed in Deno 2.x)
 */

import puppeteer from "puppeteer";

export interface LocalRenderOptions {
  width?: number;
  height?: number;
  delay?: number;
  quality?: number;
}

/** Bounding box of the actual stamp content within the viewport */
export interface ContentBounds {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RenderResult {
  buffer: Uint8Array;
  method: string;
  contentBounds?: ContentBounds;
}

/**
 * Check if Puppeteer/Chrome is available by verifying the binary exists
 */
export function isLocalRenderingAvailable(): boolean {
  try {
    const executablePath = typeof Deno !== "undefined"
      ? Deno.env.get("PUPPETEER_EXECUTABLE_PATH")
      : undefined;

    if (executablePath) {
      const stat = Deno.statSync(executablePath);
      const available = stat.isFile;
      console.log(
        `[LocalRenderer] Chrome binary at ${executablePath}: ${
          available ? "found" : "not found"
        }`,
      );
      return available;
    }

    // No explicit path set - Chrome not available in production
    console.warn(
      "[LocalRenderer] PUPPETEER_EXECUTABLE_PATH not set, Chrome rendering unavailable",
    );
    return false;
  } catch (error) {
    console.warn("[LocalRenderer] Chrome availability check failed:", error);
    return false;
  }
}

/**
 * Detect the actual content bounding box within the page.
 * Checks for canvas, SVG, and falls back to body content bounds.
 */
async function detectContentBounds(
  page: any,
  viewportWidth: number,
  viewportHeight: number,
): Promise<ContentBounds> {
  const bounds = await page.evaluate(() => {
    // Priority 1: Canvas element (most HTML stamps use canvas for rendering)
    const canvas = document.querySelector("canvas");
    if (canvas) {
      const rect = canvas.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: Math.max(0, Math.floor(rect.x)),
          y: Math.max(0, Math.floor(rect.y)),
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
        };
      }
    }

    // Priority 2: SVG element
    const svg = document.querySelector("svg");
    if (svg) {
      const rect = svg.getBoundingClientRect();
      if (rect.width > 0 && rect.height > 0) {
        return {
          x: Math.max(0, Math.floor(rect.x)),
          y: Math.max(0, Math.floor(rect.y)),
          width: Math.ceil(rect.width),
          height: Math.ceil(rect.height),
        };
      }
    }

    // Priority 3: First meaningful child of body
    const body = document.body;
    if (body && body.children.length > 0) {
      // Find the largest visible child element
      let largest = { x: 0, y: 0, width: 0, height: 0, area: 0 };
      for (const child of Array.from(body.children)) {
        const rect = child.getBoundingClientRect();
        const area = rect.width * rect.height;
        if (area > largest.area && rect.width > 0 && rect.height > 0) {
          largest = {
            x: Math.max(0, Math.floor(rect.x)),
            y: Math.max(0, Math.floor(rect.y)),
            width: Math.ceil(rect.width),
            height: Math.ceil(rect.height),
            area,
          };
        }
      }
      if (largest.area > 0) {
        return {
          x: largest.x,
          y: largest.y,
          width: largest.width,
          height: largest.height,
        };
      }
    }

    // Fallback: full body scroll dimensions
    return {
      x: 0,
      y: 0,
      width: Math.max(
        document.body.scrollWidth,
        document.documentElement.scrollWidth,
      ),
      height: Math.max(
        document.body.scrollHeight,
        document.documentElement.scrollHeight,
      ),
    };
  });

  // Clamp bounds to viewport — can't screenshot outside it
  return {
    x: Math.max(0, bounds.x),
    y: Math.max(0, bounds.y),
    width: Math.min(bounds.width, viewportWidth - bounds.x),
    height: Math.min(bounds.height, viewportHeight - bounds.y),
  };
}

/**
 * Render HTML page to PNG using local Chrome/Puppeteer.
 * Detects the actual content bounds and clips the screenshot to them.
 */
export async function renderHtmlLocal(
  stampPageUrl: string,
  options: LocalRenderOptions = {},
): Promise<{ screenshot: Uint8Array; contentBounds: ContentBounds }> {
  const {
    width = 1200,
    height = 1200,
    delay = 5000,
  } = options;

  console.log(`[LocalRenderer] Rendering ${stampPageUrl} with local Chrome`);

  let browser;
  try {
    const executablePath = typeof Deno !== "undefined"
      ? Deno.env.get("PUPPETEER_EXECUTABLE_PATH")
      : undefined;

    if (!executablePath) {
      throw new Error(
        "PUPPETEER_EXECUTABLE_PATH not set - Chrome binary location unknown",
      );
    }

    browser = await puppeteer.launch({
      headless: true,
      executablePath,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-dev-shm-usage",
        "--disable-gpu",
        "--disable-web-security",
        "--disable-extensions",
        "--no-first-run",
        "--disable-default-apps",
        "--disable-background-timer-throttling",
        "--disable-backgrounding-occluded-windows",
        "--disable-renderer-backgrounding",
        "--disable-features=TranslateUI",
        "--disable-software-rasterizer",
        "--memory-pressure-off",
        "--no-zygote",
        "--js-flags=--max-old-space-size=256",
        `--window-size=${width},${height}`,
      ],
      defaultViewport: {
        width,
        height,
        deviceScaleFactor: 1,
      },
    });

    const page = await browser.newPage();

    // Navigate to the stamp page
    await page.goto(stampPageUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for dynamic content to load
    await new Promise((resolve) => setTimeout(resolve, delay));

    // Detect actual content bounds
    const contentBounds = await detectContentBounds(page, width, height);
    console.log(
      `[LocalRenderer] Detected content bounds: ${contentBounds.width}x${contentBounds.height} at (${contentBounds.x},${contentBounds.y})`,
    );

    // If content fills most of the viewport (>80%), use full viewport clip
    // to avoid cutting off content that intentionally fills the space
    const contentArea = contentBounds.width * contentBounds.height;
    const viewportArea = width * height;
    const fillRatio = contentArea / viewportArea;

    const clip = fillRatio > 0.8
      ? { x: 0, y: 0, width, height }
      : contentBounds;

    // Take screenshot clipped to content bounds.
    // omitBackground: true makes Chrome's default white background transparent
    // while preserving any background colors explicitly set by the stamp's HTML/CSS.
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip,
      omitBackground: true,
    });

    console.log(
      `[LocalRenderer] Generated screenshot: ${clip.width}x${clip.height}, fillRatio=${
        fillRatio.toFixed(2)
      }, size=${screenshot.length} bytes`,
    );

    return {
      screenshot: new Uint8Array(screenshot),
      contentBounds: clip,
    };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    const errorStack = error instanceof Error ? error.stack : undefined;
    const errorName = error instanceof Error ? error.name : "Unknown";

    console.error(
      `[LocalRenderer] Error rendering ${stampPageUrl}:`,
      errorMessage,
    );
    console.error(`[LocalRenderer] Full error stack:`, errorStack);
    console.error(`[LocalRenderer] Error type:`, errorName);

    if (typeof Deno !== "undefined") {
      console.error(
        `[LocalRenderer] Chrome path:`,
        Deno.env.get("PUPPETEER_EXECUTABLE_PATH"),
      );
    }

    throw new Error(`Chrome launch failed: ${errorMessage}`);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * Get optimal render options based on content complexity.
 * Always uses square viewport (1200x1200) for stamp previews.
 */
export function getOptimalLocalOptions(
  isComplex: boolean = false,
): LocalRenderOptions {
  return {
    width: 1200,
    height: 1200,
    delay: isComplex ? 8000 : 5000,
    quality: 90,
  };
}

/**
 * Render HTML to PNG with content-aware cropping
 */
export async function renderHtmlSmart(
  stampPageUrl: string,
  options: LocalRenderOptions = {},
): Promise<RenderResult> {
  try {
    const { screenshot, contentBounds } = await renderHtmlLocal(
      stampPageUrl,
      options,
    );
    return { buffer: screenshot, method: "local-chrome", contentBounds };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[LocalRenderer] Local rendering failed:", errorMessage);
    throw error;
  }
}
