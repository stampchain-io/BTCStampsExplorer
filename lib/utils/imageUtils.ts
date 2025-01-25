import { StampRow } from "$globals";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
export const mimeTypes: { [key: string]: string } = {
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "svg": "image/svg+xml",
  "svgz": "image/svg+xml",
  "webp": "image/webp",
  "avif": "image/avif",
  "ico": "image/x-icon",
  "bmp": "image/bmp",
  "tiff": "image/tiff",
  "tif": "image/tiff",
  "html": "text/html",
  "htm": "text/html",
  "txt": "text/plain",
  "md": "text/markdown",
  "csv": "text/csv",
  "js": "application/javascript",
  "mjs": "application/javascript",
  "cjs": "application/javascript",
  "json": "application/json",
  "map": "application/json",
  "jsonld": "application/ld+json",
  "gz": "application/gzip",
  "gzip": "application/gzip",
  "zip": "application/zip",
  "bz": "application/x-bzip",
  "bz2": "application/x-bzip2",
  "7z": "application/x-7z-compressed",
  "css": "text/css",
  "less": "text/less",
  "sass": "text/sass",
  "scss": "text/scss",
  "xml": "application/xml",
  "wasm": "application/wasm",
  "woff": "font/woff",
  "woff2": "font/woff2",
  "ttf": "font/ttf",
  "otf": "font/otf",
  "eot": "application/vnd.ms-fontobject",
  "mp3": "audio/mpeg",
  "wav": "audio/wav",
  "mp4": "video/mp4",
  "webm": "video/webm",
  "ogg": "audio/ogg",
  "ogv": "video/ogg",
  "mpeg": "video/mpeg",
  "avi": "video/x-msvideo",
};

export const mimeTypeToSuffix = Object.entries(mimeTypes).reduce(
  (acc, [suffix, mimeType]) => {
    acc[mimeType] = suffix;
    return acc;
  },
  {} as { [key: string]: string },
);

export const getStampImageSrc = async (stamp: StampRow): Promise<string> => {
  if (!stamp.stamp_url) {
    return NOT_AVAILABLE_IMAGE;
  }

  if (stamp.stamp_url.includes("json")) {
    const res = await fetch(stamp.stamp_url);
    const jsonData = await res.json();
    return jsonData?.img.length ? jsonData.img[0] : "";
  } else {
    // Extract filename from full URL if present
    const urlParts = stamp.stamp_url.split("/stamps/");
    const filename = urlParts.length > 1
      ? urlParts[1].replace(".html", "")
      : stamp.stamp_url;

    // Use relative path
    return `/content/${filename}`;
  }
};

export const getSRC101Data = async (stamp: StampRow) => {
  if (stamp.ident !== "SRC-101") {
    return {};
  }

  const res = await fetch(stamp.stamp_url);
  const jsonData = await res.json();
  return jsonData;
};

export const getMimeType = (extension: string): string => {
  const normalizedExt = extension.toLowerCase().trim();
  return mimeTypes[normalizedExt] || "application/octet-stream";
};

export function showFallback(element: HTMLElement) {
  const fallback = document.createElement("img");
  fallback.src = NOT_AVAILABLE_IMAGE;
  fallback.alt = "Content not available";
  fallback.className = "w-full h-full object-contain rounded-lg pixelart";

  if (element instanceof HTMLIFrameElement) {
    element.style.display = "none";
    if (element.parentNode) {
      element.parentNode.appendChild(fallback);
    }
  } else {
    element.innerHTML = "";
    element.appendChild(fallback);
  }
}

export function handleImageError(e: Event) {
  if (e.currentTarget instanceof HTMLImageElement) {
    e.currentTarget.src = NOT_AVAILABLE_IMAGE;
  } else if (e.currentTarget instanceof HTMLIFrameElement) {
    showFallback(e.currentTarget);
  }
}

export function isValidSVG(svgContent: string): boolean {
  const parser = new DOMParser();
  const doc = parser.parseFromString(svgContent, "image/svg+xml");

  // Check for parsing errors
  const parserError = doc.querySelector("parsererror");
  if (parserError) return false;

  // Check for potentially dangerous elements
  const dangerous = doc.querySelectorAll(
    "foreignObject, use[href*='http'], image[href*='http'], a[href*='http']",
  );
  if (dangerous.length > 0) return false;

  // Check all elements for event handlers and external references
  const allElements = doc.getElementsByTagName("*");
  for (const element of allElements) {
    const attributes = element.attributes;
    for (const attr of attributes) {
      // Check for event handlers
      if (attr.name.startsWith("on")) return false;

      // Only block absolute URLs and data URIs
      if (attr.value.match(/^(http|data):/i)) {
        return false;
      }
    }
  }

  return true;
}

export function isValidDataUrl(url: string): boolean {
  // Basic data URL format check
  if (!url.startsWith("data:")) return false;

  // Split into media type and data
  const [header, ...rest] = url.split(",");
  if (!header || rest.length === 0) return false;

  // Check media type format
  const [mediaType] = header.slice(5).split(";");
  if (!mediaType) return false;

  // Ensure only one media type declaration
  const mediaTypeParts = mediaType.split("+");
  if (mediaTypeParts.length > 2) return false;

  return true;
}

// Keep validation logic without JSX
export const validateStampContent = async (src: string): Promise<{
  isValid: boolean;
  error?: string;
}> => {
  try {
    const response = await fetch(src);
    if (!response.ok) {
      return { isValid: false, error: "Failed to fetch content" };
    }

    const content = await response.text();
    if (!content || content.includes('"deploy"')) {
      return { isValid: false, error: "Invalid content" };
    }

    // For SVG content, do additional validation only if it contains data URLs
    if (src.endsWith(".svg") || content.trim().startsWith("<svg")) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(content, "image/svg+xml");

      // Check for parsing errors
      const parserError = doc.querySelector("parsererror");
      if (parserError) {
        return { isValid: false, error: "Invalid SVG format" };
      }

      // Only validate data URLs if they exist in the SVG
      const allElements = doc.getElementsByTagName("*");
      for (const element of allElements) {
        const attributes = element.attributes;
        for (const attr of attributes) {
          if (attr.value.startsWith("data:")) {
            if (!isValidDataUrl(attr.value)) {
              return { isValid: false, error: "Invalid data URL in SVG" };
            }
          }
        }
      }
    }

    return { isValid: true };
  } catch (error) {
    return {
      isValid: false,
      error: error instanceof Error
        ? error.message
        : "Error validating content",
    };
  }
};

export interface ContentTypeResult {
  mimeType: string;
  isGzipped: boolean;
  isJavaScript?: boolean;
}

export function detectContentType(
  content: string,
  fileName?: string | undefined,
  providedMimeType?: string | undefined,
): ContentTypeResult {
  try {
    // First check for gzip magic bytes
    if (content.startsWith("\x1f\x8b\x08")) {
      return {
        mimeType: "application/javascript",
        isGzipped: true,
        isJavaScript: true,
      };
    }

    // Decode base64 for content inspection
    const decoded = atob(content);

    // Special case: If database says text/html but content is clearly JavaScript
    if (providedMimeType === "text/html") {
      const jsPatterns = [
        /^document\.head\.insertAdjacentHTML/,
        /^!function/,
        /^window\.onload\s*=/,
      ];

      if (jsPatterns.some((pattern) => pattern.test(decoded.trim()))) {
        return {
          mimeType: "application/javascript",
          isGzipped: false,
          isJavaScript: true,
        };
      }
    }

    // For all other cases, trust the database mime type
    if (providedMimeType) {
      return {
        mimeType: providedMimeType,
        isGzipped: false,
        isJavaScript: providedMimeType.includes("javascript"),
      };
    }

    // Only use filename detection if no mime type provided
    if (fileName) {
      const extension = fileName.split(".").pop()?.toLowerCase() || "";
      return {
        mimeType: getMimeType(extension),
        isGzipped: false,
        isJavaScript: extension === "js",
      };
    }

    // Default fallback
    return {
      mimeType: "application/octet-stream",
      isGzipped: false,
      isJavaScript: false,
    };
  } catch (e) {
    console.error("Error detecting content type:", e);
    return {
      mimeType: "application/octet-stream",
      isGzipped: false,
      isJavaScript: false,
    };
  }
}
