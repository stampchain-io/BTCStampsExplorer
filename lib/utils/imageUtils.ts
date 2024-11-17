import { StampRow } from "globals";

export const NOT_AVAILABLE_IMAGE = "/not-available.png";
export const mimeTypes: { [key: string]: string } = {
  "jpg": "image/jpeg",
  "jpeg": "image/jpeg",
  "png": "image/png",
  "gif": "image/gif",
  "svg": "image/svg+xml",
  "tif": "image/tiff",
  "jfif": "image/jpeg",
  "jpe": "image/jpeg",
  "pbm": "image/x-portable-bitmap",
  "pgm": "image/x-portable-graymap",
  "ppm": "image/x-portable-pixmap",
  "pnm": "image/x-portable-anymap",
  "apng": "image/apng",
  "bmp": "image/bmp",
  "webp": "image/webp",
  "heif": "image/heif",
  "heic": "image/heic",
  "avif": "image/avif",
  "ico": "image/x-icon",
  "tiff": "image/tiff",
  "svgz": "image/svg+xml",
  "wmf": "image/wmf",
  "emf": "image/emf",
  "pcx": "image/pcx",
  "djvu": "image/vnd.djvu",
  "djv": "image/vnd.djvu",
  "html": "text/html",
  "txt": "text/plain",
};

export const mimeTypeToSuffix = Object.entries(mimeTypes).reduce(
  (acc, [suffix, mimeType]) => {
    acc[mimeType] = suffix;
    return acc;
  },
  {} as { [key: string]: string },
);

export const getMimeType = (extension: string): string => {
  const normalizedExt = extension.toLowerCase();

  return mimeTypes[normalizedExt] || "application/octet-stream";
};

export const getFileSuffixFromMime = (mimetype: string): string => {
  if (!mimetype) return "unknown";
  return mimeTypeToSuffix[mimetype] || "unknown";
};

export function getStampImageUrl(stamp: StampRow): string {
  if (!stamp?.tx_hash || !stamp?.stamp_mimetype) {
    return NOT_AVAILABLE_IMAGE;
  }

  const suffix = getFileSuffixFromMime(stamp.stamp_mimetype);
  if (suffix === "unknown") {
    return NOT_AVAILABLE_IMAGE;
  }

  return `/content/${stamp.tx_hash}.${suffix}`;
}

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

// function showFallback(element: HTMLElement) {
//   const fallback = document.createElement("img");
//   fallback.src = "/not-available.png";
//   fallback.alt = "Content not available";
//   fallback.className = "w-full h-full object-contain rounded-lg";

//   if (element instanceof HTMLIFrameElement) {
//     element.style.display = "none";
//     if (element.parentNode) {
//       element.parentNode.appendChild(fallback);
//     }
//   } else {
//     element.innerHTML = "";
//     element.appendChild(fallback);
//   }
// }
