/**
 * Server-side HTML to PNG rendering using Puppeteer
 * Replaces external screenshot services for reliable HTML rendering
 */

// For now, using a dynamic import to avoid build issues when Puppeteer isn't installed
let puppeteer: any = null;

/**
 * Configuration for HTML rendering
 */
export interface HtmlRenderOptions {
  width?: number;
  height?: number;
  delay?: number;
  quality?: number;
  deviceScaleFactor?: number;
}

/**
 * Initialize Puppeteer (lazy loading)
 */
async function initializePuppeteer() {
  if (!puppeteer) {
    try {
      // Try to import Puppeteer
      puppeteer = await import("npm:puppeteer@21.6.1");
      console.log("[HtmlRenderer] Puppeteer initialized successfully");
    } catch (_e) {
      // Handle parse errors gracefully
      return null;
    }
  }
  return puppeteer;
}

/**
 * Render an HTML stamp page to PNG using Puppeteer
 */
export async function renderHtmlToPng(
  stampPageUrl: string,
  options: HtmlRenderOptions = {},
): Promise<Uint8Array> {
  const {
    width = 1200,
    height = 1200,
    delay = 5000,
    quality: _quality = 90, // Prefix with underscore to indicate intentionally unused
    deviceScaleFactor = 1,
  } = options;

  console.log(`[HtmlRenderer] Rendering ${stampPageUrl} to PNG`);

  const pptr = await initializePuppeteer();

  // Launch browser with optimized settings
  const browser = await pptr.launch({
    headless: "new", // Use new headless mode
    args: [
      "--no-sandbox",
      "--disable-setuid-sandbox",
      "--disable-dev-shm-usage",
      "--disable-accelerated-2d-canvas",
      "--no-first-run",
      "--no-zygote",
      "--disable-gpu",
      "--disable-background-timer-throttling",
      "--disable-backgrounding-occluded-windows",
      "--disable-renderer-backgrounding",
    ],
    defaultViewport: {
      width,
      height,
      deviceScaleFactor,
    },
  });

  try {
    const page = await browser.newPage();

    // Set additional page settings
    await page.setViewport({ width, height, deviceScaleFactor });

    // Block unnecessary resources for faster loading
    await page.setRequestInterception(true);
    page.on("request", (req: any) => {
      const resourceType = req.resourceType();
      if (["font", "image"].includes(resourceType)) {
        // Allow fonts and images as they might be important for stamps
        req.continue();
      } else if (["media", "websocket", "manifest"].includes(resourceType)) {
        // Block unnecessary resources
        req.abort();
      } else {
        req.continue();
      }
    });

    // Navigate to the stamp page
    console.log(`[HtmlRenderer] Loading page: ${stampPageUrl}`);
    await page.goto(stampPageUrl, {
      waitUntil: "networkidle0",
      timeout: 30000,
    });

    // Wait for dynamic content and animations
    console.log(`[HtmlRenderer] Waiting ${delay}ms for content rendering`);
    await page.waitForTimeout(delay);

    // Additional wait for any animations or recursive rendering
    try {
      // Wait for any canvas elements to be ready
      await page.waitForFunction(() => {
        const canvases = document.querySelectorAll("canvas");
        return Array.from(canvases).every((canvas) =>
          canvas.width > 0 && canvas.height > 0
        );
      }, { timeout: 5000 });
    } catch (_e) {
      // Canvas check failed, continue anyway
      console.log(
        "[HtmlRenderer] No canvas elements or timeout waiting for canvas",
      );
    }

    // Take screenshot of the rendered content
    console.log("[HtmlRenderer] Taking screenshot");
    const screenshot = await page.screenshot({
      type: "png",
      clip: { x: 0, y: 0, width, height },
      omitBackground: false, // Include background
    });

    console.log(
      `[HtmlRenderer] Screenshot complete, size: ${screenshot.length} bytes`,
    );
    return new Uint8Array(screenshot);
  } catch (_error) {
    console.error("[HtmlRenderer] Error in renderHtmlToPng:", _error);
    throw new Error("Failed to render HTML to PNG");
  } finally {
    await browser.close();
    console.log("[HtmlRenderer] Browser closed");
  }
}

/**
 * Check if Puppeteer is available
 */
export async function isPuppeteerAvailable(): Promise<boolean> {
  try {
    await initializePuppeteer();
    return true;
  } catch (_error) {
    return false;
  }
}

/**
 * Get optimized render options based on content type
 */
export function getOptimalRenderOptions(
  isComplex: boolean = false,
): HtmlRenderOptions {
  return {
    width: 1200,
    height: 1200,
    delay: isComplex ? 8000 : 5000, // More time for complex/recursive content
    quality: 90,
    deviceScaleFactor: 1,
  };
}
