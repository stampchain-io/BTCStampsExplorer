/**
 * Utility functions for SVG processing
 */

/**
 * Detects if an SVG should have a white background based on its content
 */
export function detectSvgBackground(svgContent: string): string | undefined {
  // Check for explicit white background rectangle covering the whole viewBox
  const fullScreenWhiteRect =
    /<rect[^>]*width=["']100%["'][^>]*height=["']100%["'][^>]*fill=["'](?:white|#fff|#ffffff)["']/i;
  if (fullScreenWhiteRect.test(svgContent)) {
    return "white";
  }

  // Check for background in style
  const backgroundStyle = /background\s*:\s*(?:white|#fff|#ffffff)/i;
  if (backgroundStyle.test(svgContent)) {
    return "white";
  }

  // Check if SVG has a white rectangle as first element (common pattern)
  const firstElementWhite =
    /<svg[^>]*>\s*<rect[^>]*fill=["'](?:white|#fff|#ffffff)["'][^>]*\/>/i;
  if (firstElementWhite.test(svgContent)) {
    return "white";
  }

  // Default to transparent
  return undefined;
}

/**
 * Extracts SVG dimensions and calculates proper output size
 */
export function calculateSvgDimensions(
  svgContent: string,
  targetWidth: number = 1200,
): { width: number; height: number } {
  // Try to extract viewBox
  const viewBoxMatch = svgContent.match(/viewBox=["']([^"']+)["']/);
  if (viewBoxMatch) {
    const [, , vbWidth, vbHeight] = viewBoxMatch[1].split(/\s+/).map(Number);
    if (vbWidth && vbHeight) {
      const aspectRatio = vbWidth / vbHeight;
      return {
        width: targetWidth,
        height: Math.round(targetWidth / aspectRatio),
      };
    }
  }

  // Try width/height attributes
  const widthMatch = svgContent.match(/width=["'](\d+(?:\.\d+)?)/);
  const heightMatch = svgContent.match(/height=["'](\d+(?:\.\d+)?)/);

  if (widthMatch && heightMatch) {
    const width = parseFloat(widthMatch[1]);
    const height = parseFloat(heightMatch[1]);
    const aspectRatio = width / height;
    return {
      width: targetWidth,
      height: Math.round(targetWidth / aspectRatio),
    };
  }

  // Default to square
  return { width: targetWidth, height: targetWidth };
}

/**
 * Configuration options for SVG to PNG conversion
 */
export interface SvgConversionOptions {
  width?: number;
  height?: number;
  background?: string;
  font?: {
    loadSystemFonts?: boolean;
  };
  padding?: {
    color?: string;
  };
}

/**
 * Calculate dimensions for social media preview (1.91:1 aspect ratio)
 */
export function calculateSocialMediaDimensions(
  originalWidth: number,
  originalHeight: number,
  targetWidth: number = 1200,
  targetHeight: number = 630,
): {
  canvasWidth: number;
  canvasHeight: number;
  imageWidth: number;
  imageHeight: number;
  x: number;
  y: number;
} {
  const targetAspect = targetWidth / targetHeight;
  const originalAspect = originalWidth / originalHeight;

  let imageWidth = targetWidth;
  let imageHeight = targetHeight;
  let x = 0;
  let y = 0;

  if (originalAspect > targetAspect) {
    // Original is wider - fit width, letterbox top/bottom
    imageWidth = targetWidth;
    imageHeight = Math.round(targetWidth / originalAspect);
    y = Math.round((targetHeight - imageHeight) / 2);
  } else if (originalAspect < targetAspect) {
    // Original is taller - fit height, pillarbox left/right
    imageHeight = targetHeight;
    imageWidth = Math.round(targetHeight * originalAspect);
    x = Math.round((targetWidth - imageWidth) / 2);
  }
  // If aspects match, no padding needed

  return {
    canvasWidth: targetWidth,
    canvasHeight: targetHeight,
    imageWidth,
    imageHeight,
    x,
    y,
  };
}

/**
 * Get optimal conversion options for an SVG
 */
export function getOptimalConversionOptions(
  svgContent: string,
  forSocialMedia: boolean = true,
  _preferSquare: boolean = false,
): SvgConversionOptions {
  const background = detectSvgBackground(svgContent);
  const dimensions = calculateSvgDimensions(svgContent);

  if (forSocialMedia) {
    // Always use 1:1 square format for social media
    // This works best for both X and Telegram
    return {
      width: 1200,
      height: 1200, // Square format - no cropping on X, native support on Telegram
      background: background || "#14001f",
      font: {
        loadSystemFonts: false,
      },
      padding: {
        color: "#14001f",
      },
    };
  }

  // For other uses, maintain original aspect ratio
  return {
    width: dimensions.width,
    height: dimensions.height,
    ...(background && { background }),
    font: {
      loadSystemFonts: false,
    },
  };
}
