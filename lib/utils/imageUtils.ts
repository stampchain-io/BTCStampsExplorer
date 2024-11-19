import { StampRow } from "globals";

const NOT_AVAILABLE_IMAGE = "/not-available.png";
const mimeTypes: { [key: string]: string } = {
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

export const getStampImageSrc = (stamp: StampRow) => {
  if (!stamp.stamp_url) {
    return NOT_AVAILABLE_IMAGE;
  }
  const filename = stamp.stamp_url.split("/").pop();
  return `/content/${filename}`;
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

    return { isValid: true };
  } catch {
    return { isValid: false, error: "Error validating content" };
  }
};
