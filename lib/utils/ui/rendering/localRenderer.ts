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
        `[LocalRenderer] Chrome binary at ${executablePath}: ${available ? "found" : "not found"}`,
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
 * Render HTML page to PNG using local Chrome/Puppeteer
 */
export async function renderHtmlLocal(
  stampPageUrl: string,
  options: LocalRenderOptions = {},
): Promise<Uint8Array> {
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

    // Take screenshot
    const screenshot = await page.screenshot({
      type: "png",
      fullPage: false,
      clip: {
        x: 0,
        y: 0,
        width,
        height,
      },
    });

    console.log(
      `[LocalRenderer] Generated screenshot, size: ${screenshot.length} bytes`,
    );

    return new Uint8Array(screenshot);
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
 * Get optimal render options based on content complexity
 */
export function getOptimalLocalOptions(
  isComplex: boolean = false,
  forSocialMedia: boolean = true,
): LocalRenderOptions {
  return {
    width: 1200,
    height: forSocialMedia ? 630 : 1200, // 1.91:1 for social media
    delay: isComplex ? 8000 : 5000,
    quality: 90,
  };
}

/**
 * Render HTML to PNG with smart fallback to SVG renderer if needed
 */
export async function renderHtmlSmart(
  stampPageUrl: string,
  options: LocalRenderOptions = {},
): Promise<{ buffer: Uint8Array; method: string }> {
  try {
    const buffer = await renderHtmlLocal(stampPageUrl, options);
    return { buffer, method: "local-chrome" };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error("[LocalRenderer] Local rendering failed:", errorMessage);
    throw error;
  }
}
