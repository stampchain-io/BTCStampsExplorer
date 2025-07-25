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
 */
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
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

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { stamp } = ctx.params;
      // Get stamp details
      const stampData = await StampController.getSpecificStamp(stamp);
      if (!stampData?.stamp_url) {
        return ApiResponseUtil.notFound("Stamp not found");
      }

      const { stamp_url, stamp_mimetype, stamp: stampNumber } = stampData;

      // For non-SVG images, we need to fetch and process them for social media dimensions
      // ImageScript supports: PNG, JPEG, GIF, TIFF
      // Not supported: WebP, BMP, AVIF (will fallback to logo)
      if (
        stamp_mimetype?.startsWith("image/") &&
        stamp_mimetype !== "image/svg+xml"
      ) {
        try {
          // Fetch the original image
          const imageResponse = await fetch(stamp_url);
          if (!imageResponse.ok) {
            throw new Error(`Failed to fetch image: ${imageResponse.status}`);
          }

          // For pixel art stamps, we need to upscale them
          const imageBuffer = await imageResponse.arrayBuffer();

          try {
            // Decode the image
            const sourceImage = await Image.decode(new Uint8Array(imageBuffer));

            // Calculate scale factor to fit in 1200x1200 while preserving aspect ratio
            const maxDimension = Math.max(
              sourceImage.width,
              sourceImage.height,
            );
            const targetSize = 1200;

            // Use integer scaling for pixel-perfect results
            // Ensure minimum scale of 2 for very small images
            const scale = Math.max(2, Math.floor(targetSize / maxDimension));
            const scaledWidth = Math.min(sourceImage.width * scale, targetSize);
            const scaledHeight = Math.min(
              sourceImage.height * scale,
              targetSize,
            );

            // Create output image with padding to make it square
            const outputImage = new Image(targetSize, targetSize);

            // Fill background with dark purple
            const bgColor = 0x14001fff; // #14001f with full alpha
            outputImage.fill(bgColor);

            // Calculate position to center the scaled image
            const offsetX = Math.floor((targetSize - scaledWidth) / 2);
            const offsetY = Math.floor((targetSize - scaledHeight) / 2);

            // Perform nearest-neighbor upscaling
            for (let y = 0; y < sourceImage.height; y++) {
              for (let x = 0; x < sourceImage.width; x++) {
                const pixel = sourceImage.getPixelAt(x + 1, y + 1); // ImageScript uses 1-indexed

                // Draw scaled pixel block
                for (let dy = 0; dy < scale; dy++) {
                  for (let dx = 0; dx < scale; dx++) {
                    outputImage.setPixelAt(
                      offsetX + x * scale + dx + 1,
                      offsetY + y * scale + dy + 1,
                      pixel,
                    );
                  }
                }
              }
            }

            // Encode as PNG with maximum compression (level 9)
            const pngBuffer = await outputImage.encode(9);

            return new Response(pngBuffer, {
              status: 200,
              headers: {
                "Content-Type": "image/png",
                "X-Stamp-Number": stampNumber?.toString() || "unknown",
                "X-Original-Type": stamp_mimetype,
                "X-Conversion-Method": "imagescript-upscale",
                "X-Original-Size": `${sourceImage.width}x${sourceImage.height}`,
                "X-Scale-Factor": scale.toString(),
                "X-Dimensions": "1200x1200",
                ...CACHE_HEADERS.success,
              },
            });
          } catch (upscaleError: unknown) {
            console.error("Image upscaling error:", upscaleError);
            // Check if it's an unsupported format
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

            // Fallback to redirect for unsupported formats
            return new Response(null, {
              status: 302,
              headers: {
                Location: stamp_url,
                ...CACHE_HEADERS.redirect,
                "X-Error": `upscale-failed: ${errorMessage}`,
                "X-Unsupported-Format": isUnsupportedFormat
                  ? stamp_mimetype
                  : "false",
              },
            });
          }
        } catch (error: unknown) {
          console.error("Image fetch error:", error);
          const errorMessage = error instanceof Error
            ? error.message
            : String(error);
          return new Response(null, {
            status: 302,
            headers: {
              Location:
                "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg",
              "X-Error": `image-fetch-failed: ${errorMessage}`,
              "X-Fallback": "default-logo",
              ...CACHE_HEADERS.error,
            },
          });
        }
      }

      // For SVGs, convert to PNG using resvg-wasm
      if (stamp_mimetype === "image/svg+xml") {
        try {
          // Ensure WASM is initialized
          await ensureWasmInitialized();

          // Fetch the SVG content
          const svgResponse = await fetch(stamp_url);
          if (!svgResponse.ok) {
            throw new Error(`Failed to fetch SVG: ${svgResponse.status}`);
          }

          const svgContent = await svgResponse.text();

          // Check if SVG contains animations or complex CSS
          const hasAnimations = svgContent.includes("@keyframes") ||
            svgContent.includes("animation:") ||
            svgContent.includes("animation-");

          let processedSvgContent = svgContent;

          if (hasAnimations) {
            console.log(
              `SVG contains animations that resvg-wasm cannot handle: ${stampNumber}`,
            );

            // Try to strip out style tags to get a static version
            // This is a simple approach - remove entire style tag
            processedSvgContent = processedSvgContent.replace(
              /<style[^>]*>[\s\S]*?<\/style>/gi,
              "",
            );

            // Also remove any inline animation styles
            processedSvgContent = processedSvgContent.replace(
              /animation[^;]*;?/gi,
              "",
            );
            processedSvgContent = processedSvgContent.replace(
              /animation-[^;]*;?/gi,
              "",
            );
          }

          // Get optimal conversion options based on processed SVG content
          const conversionOptions = getOptimalConversionOptions(
            processedSvgContent,
          );

          // Convert SVG to PNG using resvg with optimal settings
          // For social media, we need to handle the aspect ratio properly
          const originalDimensions = calculateSvgDimensions(
            processedSvgContent,
          );

          // Use target dimensions from conversion options (1200x1200 for square, 1200x630 for wide)
          const targetWidth = conversionOptions.width || 1200;
          const targetHeight = conversionOptions.height || 1200;

          const socialDimensions = calculateSocialMediaDimensions(
            originalDimensions.width,
            originalDimensions.height,
            targetWidth,
            targetHeight,
          );

          // Create a wrapper SVG with proper dimensions and padding
          const paddingColor = conversionOptions.padding?.color || "#14001f";

          // Extract viewBox from processed SVG if present
          const viewBoxMatch = processedSvgContent.match(
            /viewBox=["']([^"']+)["']/,
          );
          const viewBox = viewBoxMatch
            ? viewBoxMatch[1]
            : `0 0 ${originalDimensions.width} ${originalDimensions.height}`;

          // Create wrapper SVG that includes padding
          const wrappedSvg =
            `<svg width="${targetWidth}" height="${targetHeight}" viewBox="0 0 ${targetWidth} ${targetHeight}" xmlns="http://www.w3.org/2000/svg">
            <rect width="${targetWidth}" height="${targetHeight}" fill="${paddingColor}"/>
            <svg x="${socialDimensions.x}" y="${socialDimensions.y}"
                 width="${socialDimensions.imageWidth}" height="${socialDimensions.imageHeight}"
                 viewBox="${viewBox}">
              ${processedSvgContent.replace(/<\/?svg[^>]*>/g, "")}
            </svg>
          </svg>`;

          // Render the wrapped SVG with padding
          const resvgOptions: any = {
            fitTo: {
              mode: "width",
              value: targetWidth,
            },
            background: paddingColor,
          };

          // Only add font if it's defined
          if (conversionOptions.font) {
            resvgOptions.font = conversionOptions.font;
          }

          const resvg = new Resvg(wrappedSvg, resvgOptions);

          const pngData = resvg.render();
          const pngBuffer = pngData.asPng();

          // Return the PNG directly with proper caching headers
          return new Response(pngBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "X-Stamp-Number": stampNumber?.toString() || "unknown",
              "X-Original-Type": stamp_mimetype,
              "X-Conversion-Method": "resvg-wasm",
              "X-Background": conversionOptions.background || "transparent",
              "X-Dimensions": `${pngData.width}x${pngData.height}`,
              "X-Animations-Stripped": hasAnimations ? "true" : "false",
              ...CACHE_HEADERS.success,
            },
          });
        } catch (conversionError: unknown) {
          const errorMessage = conversionError instanceof Error
            ? conversionError.message
            : String(conversionError);
          console.error(
            "SVG to PNG conversion error:",
            errorMessage,
          );
          console.error("Full SVG conversion error:", conversionError);

          // For SVG conversion errors, only fallback to placeholder
          // Don't attempt HTML rendering as that requires Chrome and is unreliable for SVGs
          return new Response(null, {
            status: 302,
            headers: {
              Location:
                "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg",
              "X-Conversion-Method": "svg-conversion-failed",
              "X-Error": `resvg-wasm-failed: ${errorMessage}`,
              "X-Fallback": "default-logo",
              ...CACHE_HEADERS.error,
            },
          });
        }
      }

      // For HTML content, use local Chrome rendering
      if (stamp_mimetype === "text/html") {
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
          return new Response(null, {
            status: 302,
            headers: {
              Location:
                "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg",
              "X-Error": "no-local-rendering",
              "X-Fallback": "default-logo",
              ...CACHE_HEADERS.error,
            },
          });
        }

        try {
          // Create the stamp page URL for rendering
          const requestUrl = new URL(_req.url);
          const protocol = requestUrl.hostname === "localhost"
            ? "http:"
            : "https:";
          const stampPageUrl =
            `${protocol}//${requestUrl.host}/stamp/${stampNumber}`;

          console.log(
            `[HTML Preview] Starting render for stamp ${stampNumber}`,
            {
              stampPageUrl,
              stamp: stampNumber,
              mimetype: stamp_mimetype,
              dockerPath: Deno.env.get("PUPPETEER_EXECUTABLE_PATH"),
              isDocker: Deno.env.get("PUPPETEER_EXECUTABLE_PATH") ===
                "/usr/bin/chromium-browser",
            },
          );

          // Determine if this is complex content (for extended render time)
          const isComplex = stamp_url?.includes("recursive") ||
            stamp_url?.includes("fractal") ||
            stamp_url?.includes("canvas");

          const renderOptions = getOptimalLocalOptions(isComplex);
          const { buffer: pngBuffer, method } = await renderHtmlSmart(
            stampPageUrl,
            renderOptions,
          );

          console.log(
            `[HTML Preview] Successfully rendered stamp ${stampNumber}`,
            {
              stamp: stampNumber,
              method,
              bufferSize: pngBuffer.length,
              isComplex,
              renderTime: isComplex ? "extended" : "standard",
            },
          );

          return new Response(pngBuffer, {
            status: 200,
            headers: {
              "Content-Type": "image/png",
              "X-Stamp-Number": stampNumber?.toString() || "unknown",
              "X-Original-Type": stamp_mimetype,
              "X-Conversion-Method": method,
              "X-Render-Time": isComplex ? "extended" : "standard",
              "X-Rendering-Engine": "local-chrome",
              ...CACHE_HEADERS.success,
            },
          });
        } catch (htmlError: unknown) {
          const errorMessage = htmlError instanceof Error
            ? htmlError.message
            : String(htmlError);
          const errorStack = htmlError instanceof Error
            ? htmlError.stack
            : undefined;
          console.error(
            "[HTML Preview] Rendering failed for stamp",
            stampNumber,
            {
              error: errorMessage,
              stack: errorStack,
              stamp: stampNumber,
              mimetype: stamp_mimetype,
              dockerPath: Deno.env.get("PUPPETEER_EXECUTABLE_PATH"),
              isDocker: Deno.env.get("PUPPETEER_EXECUTABLE_PATH") ===
                "/usr/bin/chromium-browser",
              fallbackUsed: "default-logo",
            },
          );
          return new Response(null, {
            status: 302,
            headers: {
              Location:
                "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg",
              "X-Error": "html-render-failed",
              "X-Rendering-Engine": "local-chrome",
              "X-Fallback": "default-logo",
              ...CACHE_HEADERS.error,
            },
          });
        }
      }

      // For other content types, fallback to default logo
      return new Response(null, {
        status: 302,
        headers: {
          Location:
            "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg",
          "X-Fallback": "unsupported-content-type",
          ...CACHE_HEADERS.error,
        },
      });
    } catch (error) {
      console.error("Preview generation error:", error);
      return new Response(null, {
        status: 302,
        headers: {
          Location:
            "https://stampchain.io/img/logo/stampchain-logo-opengraph.jpg",
          "X-Fallback": "general-error",
          ...CACHE_HEADERS.error,
        },
      });
    }
  },
};
