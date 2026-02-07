/**
 * Social Media Preview Generator for Bitcoin Stamps
 *
 * Supported formats:
 * - SVG: Converted to PNG using resvg-wasm with proper padding
 * - PNG/JPEG/GIF/TIFF: Upscaled using ImageScript with pixel-perfect scaling
 * - HTML: Rendered using local Chrome instance
 *
 * Unsupported formats (fallback to original or logo):
 * - WebP, BMP, AVIF: Not supported by ImageScript decoder
 *
 * All images are output as 1200x1200 PNG with compression level 9
 *
 * Caching: Rendered PNGs are cached in Redis as base64. Stamps are immutable
 * blockchain data so cache entries never expire ("never" TTL).
 */
import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";
import {
  getOptimalLocalOptions,
  isLocalRenderingAvailable,
  renderHtmlSmart,
} from "$lib/utils/ui/rendering/localRenderer.ts";
import {
  calculateSocialMediaDimensions,
  calculateSvgDimensions,
  getOptimalConversionOptions,
} from "$lib/utils/ui/rendering/svgUtils.ts";
import { StampController } from "$server/controller/stampController.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { Image } from "https://deno.land/x/imagescript@1.3.0/mod.ts";
import { initWasm, Resvg } from "npm:@resvg/resvg-wasm@2.6.0";

// Initialize WASM on module load
let wasmInitialized = false;
async function ensureWasmInitialized() {
  if (!wasmInitialized) {
    await initWasm(
      fetch("https://unpkg.com/@resvg/resvg-wasm@2.6.0/index_bg.wasm"),
    );
    wasmInitialized = true;
  }
}

// Check local rendering availability
const isLocalRenderingReady = isLocalRenderingAvailable();
console.log("[Preview] Local rendering available:", isLocalRenderingReady);

// Cache control headers for different scenarios
const CACHE_HEADERS = {
  // Cache successful conversions for 1 year
  success: { "Cache-Control": "public, max-age=31536000, immutable" },
  // Cache redirects for 1 day
  redirect: { "Cache-Control": "public, max-age=86400" },
  // Don't cache errors
  error: { "Cache-Control": "no-cache, no-store" },
};

const FALLBACK_LOGO =
  "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg";

/** Cached preview stored in Redis: base64 PNG + metadata headers */
interface CachedPreview {
  png: string;
  meta: Record<string, string>;
}

/** Encode Uint8Array to base64 string */
function toBase64(data: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < data.length; i++) {
    binary += String.fromCharCode(data[i]);
  }
  return btoa(binary);
}

/** Decode base64 string to Uint8Array */
function fromBase64(b64: string): Uint8Array {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

/**
 * Render a stamp preview PNG. Returns CachedPreview on success, null on failure.
 * Null results are NOT cached permanently — they get stored as JSON "null" (5 bytes)
 * and treated as cache miss on next read, so failed renders are retried.
 */
async function renderPreview(
  stampIdentifier: string,
): Promise<CachedPreview | null> {
  const stampData = await StampController.getSpecificStamp(stampIdentifier);
  if (!stampData?.stamp_url) {
    return null;
  }

  const { stamp_url, stamp_mimetype, stamp: stampNumber } = stampData;

  // Raster images (PNG, JPEG, GIF, TIFF) — upscale with ImageScript
  if (
    stamp_mimetype?.startsWith("image/") &&
    stamp_mimetype !== "image/svg+xml"
  ) {
    return await renderRasterPreview(stamp_url, stamp_mimetype, stampNumber);
  }

  // SVG — convert with resvg-wasm
  if (stamp_mimetype === "image/svg+xml") {
    return await renderSvgPreview(stamp_url, stamp_mimetype, stampNumber);
  }

  // HTML — render with local Chrome
  if (stamp_mimetype === "text/html") {
    return await renderHtmlPreview(stamp_url, stamp_mimetype, stampNumber);
  }

  // Unsupported content type
  return null;
}

async function renderRasterPreview(
  stamp_url: string,
  stamp_mimetype: string,
  stampNumber: number | undefined,
): Promise<CachedPreview | null> {
  const imageResponse = await fetch(stamp_url);
  if (!imageResponse.ok) {
    console.error(`Failed to fetch image: ${imageResponse.status}`);
    return null;
  }

  const imageBuffer = await imageResponse.arrayBuffer();

  try {
    const sourceImage = await Image.decode(new Uint8Array(imageBuffer));

    const maxDimension = Math.max(sourceImage.width, sourceImage.height);
    const targetSize = 1200;

    const rawScale = Math.max(2, Math.floor(targetSize / maxDimension));
    const scale = Math.min(
      rawScale,
      Math.floor(targetSize / sourceImage.width),
      Math.floor(targetSize / sourceImage.height),
    );
    const scaledWidth = sourceImage.width * scale;
    const scaledHeight = sourceImage.height * scale;

    const outputImage = new Image(targetSize, targetSize);
    const bgColor = 0x14001fff; // #14001f with full alpha
    outputImage.fill(bgColor);

    const offsetX = Math.floor((targetSize - scaledWidth) / 2);
    const offsetY = Math.floor((targetSize - scaledHeight) / 2);

    for (let y = 0; y < sourceImage.height; y++) {
      for (let x = 0; x < sourceImage.width; x++) {
        const pixel = sourceImage.getPixelAt(x + 1, y + 1);
        for (let dy = 0; dy < scale; dy++) {
          const py = offsetY + y * scale + dy + 1;
          if (py < 1 || py > targetSize) continue;
          for (let dx = 0; dx < scale; dx++) {
            const px = offsetX + x * scale + dx + 1;
            if (px < 1 || px > targetSize) continue;
            outputImage.setPixelAt(px, py, pixel);
          }
        }
      }
    }

    const pngBuffer = await outputImage.encode(9);

    return {
      png: toBase64(pngBuffer),
      meta: {
        "X-Stamp-Number": stampNumber?.toString() || "unknown",
        "X-Original-Type": stamp_mimetype,
        "X-Conversion-Method": "imagescript-upscale",
        "X-Original-Size": `${sourceImage.width}x${sourceImage.height}`,
        "X-Scale-Factor": scale.toString(),
        "X-Dimensions": "1200x1200",
      },
    };
  } catch (upscaleError: unknown) {
    console.error("Image upscaling error:", upscaleError);
    const errorMessage = upscaleError instanceof Error
      ? upscaleError.message
      : String(upscaleError);
    const isUnsupportedFormat =
      errorMessage.includes("Unknown file signature") ||
      errorMessage.includes("Invalid") ||
      stamp_mimetype === "image/webp" ||
      stamp_mimetype === "image/bmp" ||
      stamp_mimetype === "image/avif";

    if (isUnsupportedFormat) {
      console.log(`Unsupported image format: ${stamp_mimetype}`);
    }

    return null;
  }
}

async function renderSvgPreview(
  stamp_url: string,
  stamp_mimetype: string,
  stampNumber: number | undefined,
): Promise<CachedPreview | null> {
  await ensureWasmInitialized();

  const svgResponse = await fetch(stamp_url);
  if (!svgResponse.ok) {
    console.error(`Failed to fetch SVG: ${svgResponse.status}`);
    return null;
  }

  const svgContent = await svgResponse.text();

  const hasAnimations = svgContent.includes("@keyframes") ||
    svgContent.includes("animation:") ||
    svgContent.includes("animation-");

  let processedSvgContent = svgContent;

  if (hasAnimations) {
    console.log(
      `SVG contains animations that resvg-wasm cannot handle: ${stampNumber}`,
    );
    processedSvgContent = processedSvgContent.replace(
      /<style[^>]*>[\s\S]*?<\/style>/gi,
      "",
    );
    processedSvgContent = processedSvgContent.replace(
      /animation[^;]*;?/gi,
      "",
    );
    processedSvgContent = processedSvgContent.replace(
      /animation-[^;]*;?/gi,
      "",
    );
  }

  const conversionOptions = getOptimalConversionOptions(processedSvgContent);
  const originalDimensions = calculateSvgDimensions(processedSvgContent);

  const targetWidth = conversionOptions.width || 1200;
  const targetHeight = conversionOptions.height || 1200;

  const socialDimensions = calculateSocialMediaDimensions(
    originalDimensions.width,
    originalDimensions.height,
    targetWidth,
    targetHeight,
  );

  const paddingColor = conversionOptions.padding?.color || "#14001f";

  const viewBoxMatch = processedSvgContent.match(
    /viewBox=["']([^"']+)["']/,
  );
  const viewBox = viewBoxMatch
    ? viewBoxMatch[1]
    : `0 0 ${originalDimensions.width} ${originalDimensions.height}`;

  const wrappedSvg =
    `<svg width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${targetWidth}" height="${targetHeight}" fill="${paddingColor}"/>
            <svg x="${socialDimensions.x}" y="${socialDimensions.y}"
                 width="${socialDimensions.imageWidth}" height="${socialDimensions.imageHeight}"
                 viewBox="${viewBox}">
              ${processedSvgContent.replace(/<\/?svg[^>]*>/g, "")}
            </svg>
          </svg>`;

  const resvgOptions: any = {
    fitTo: {
      mode: "width",
      value: targetWidth,
    },
    background: paddingColor,
  };

  if (conversionOptions.font) {
    resvgOptions.font = conversionOptions.font;
  }

  const resvg = new Resvg(wrappedSvg, resvgOptions);
  const pngData = resvg.render();
  const pngBuffer = pngData.asPng();

  return {
    png: toBase64(pngBuffer),
    meta: {
      "X-Stamp-Number": stampNumber?.toString() || "unknown",
      "X-Original-Type": stamp_mimetype,
      "X-Conversion-Method": "resvg-wasm",
      "X-Background": conversionOptions.background || "transparent",
      "X-Dimensions": `${pngData.width}x${pngData.height}`,
      "X-Animations-Stripped": hasAnimations ? "true" : "false",
    },
  };
}

async function renderHtmlPreview(
  stamp_url: string,
  stamp_mimetype: string,
  stampNumber: number | undefined,
): Promise<CachedPreview | null> {
  if (!isLocalRenderingReady) {
    console.error(
      "[HTML Preview] Chrome rendering not available for HTML content",
      {
        stamp: stampNumber,
        mimetype: stamp_mimetype,
        dockerPath: Deno.env.get("PUPPETEER_EXECUTABLE_PATH"),
        isDocker: Deno.env.get("PUPPETEER_EXECUTABLE_PATH") ===
          "/usr/bin/chromium-browser",
      },
    );
    return null;
  }

  const urlParts = stamp_url.split("/stamps/");
  const filename = urlParts.length > 1 ? urlParts[1] : stamp_url;
  const htmlIdentifier = filename.replace(/\.html?$/i, "");
  const stampPageUrl = `http://localhost:8000/content/${htmlIdentifier}`;

  console.log(
    `[HTML Preview] Starting render for stamp ${stampNumber} via /content/ endpoint`,
  );

  const isComplex = stamp_url?.includes("recursive") ||
    stamp_url?.includes("fractal") ||
    stamp_url?.includes("canvas");

  const renderOptions = getOptimalLocalOptions(isComplex);
  const { buffer: pngBuffer, method } = await renderHtmlSmart(
    stampPageUrl,
    renderOptions,
  );

  console.log(
    `[HTML Preview] Successfully rendered stamp ${stampNumber}, size=${pngBuffer.length}`,
  );

  return {
    png: toBase64(pngBuffer),
    meta: {
      "X-Stamp-Number": stampNumber?.toString() || "unknown",
      "X-Original-Type": stamp_mimetype,
      "X-Conversion-Method": method,
      "X-Render-Time": isComplex ? "extended" : "standard",
      "X-Rendering-Engine": "local-chrome",
    },
  };
}

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { stamp } = ctx.params;
      const cacheKey = `preview:${stamp}`;

      // handleCache returns cached data on hit, or calls renderPreview on miss.
      // We use a wrapper to track whether this was a cache hit or fresh render.
      let wasRendered = false;
      const cached = await dbManager.handleCache<CachedPreview | null>(
        cacheKey,
        async () => {
          wasRendered = true;
          return await renderPreview(stamp);
        },
        "never",
      );

      if (cached?.png) {
        const pngBytes = fromBase64(cached.png);
        return WebResponseUtil.binaryResponse(pngBytes, "image/png", {
          immutableBinary: true,
          headers: {
            ...cached.meta,
            "X-Cache": wasRendered ? "rendered" : "redis-hit",
            ...CACHE_HEADERS.success,
          },
        });
      }

      // null result — stamp not found, unsupported format, or render failure
      // Return fallback redirect (not cached permanently — null in Redis
      // is treated as cache miss on next read so render is retried)
      return WebResponseUtil.redirect(FALLBACK_LOGO, 302, {
        headers: {
          "X-Fallback": "render-failed-or-unsupported",
          ...CACHE_HEADERS.redirect,
        },
      });
    } catch (error) {
      console.error("Preview generation error:", error);
      return WebResponseUtil.redirect(FALLBACK_LOGO, 302, {
        headers: {
          "X-Fallback": "general-error",
          ...CACHE_HEADERS.error,
        },
      });
    }
  },
};
