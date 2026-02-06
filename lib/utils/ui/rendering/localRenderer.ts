/**
 * Local HTML to PNG rendering using Puppeteer with lightweight Chrome
 * No external dependencies - runs entirely on our server
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

    // No explicit path set - assume Puppeteer bundled Chrome may be available (dev mode)
    return true;
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
    quality = 90,
  } = options;

  console.log(`[LocalRenderer] Rendering ${stampPageUrl} with local Chrome`);

  let browser;
  try {
    // Use PUPPETEER_EXECUTABLE_PATH if set (Docker), otherwise let Puppeteer use its bundled Chrome
    // Server-side only - Deno APIs not available in browser
    const executablePath =
      typeof window === "undefined" && typeof Deno !== "undefined"
        ? Deno.env.get("PUPPETEER_EXECUTABLE_PATH")
        : undefined;

    // Launch browser with minimal flags for headless environment
    const launchOptions: any = {
      headless: "new" as any, // Puppeteer types may not be up to date with "new" option
      dumpio: true, // Pipe Chrome process stderr/stdout for debugging
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
        "--single-process",
        "--no-zygote",
        `--window-size=${width},${height}`,
      ],
      defaultViewport: {
        width,
        height,
        deviceScaleFactor: 1,
      },
    };

    // Only add executablePath if it's defined
    if (executablePath) {
      launchOptions.executablePath = executablePath;
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    // Set viewport
    await page.setViewport({
      width,
      height,
      deviceScaleFactor: 1,
    });

    // Navigate to the stamp page
    await page.goto(stampPageUrl, {
      waitUntil: "networkidle2",
      timeout: 30000,
    });

    // Wait for any dynamic content to load
    await page.waitForTimeout(delay);

    // Take screenshot
    const screenshot = await page.screenshot({
      type: "png",
      quality,
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

    // Server-side only error logging
    if (typeof window === "undefined" && typeof Deno !== "undefined") {
      console.error(
        `[LocalRenderer] Chrome path:`,
        Deno.env.get("PUPPETEER_EXECUTABLE_PATH"),
      );
    }

    // Always throw the original error to see what's really happening
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
