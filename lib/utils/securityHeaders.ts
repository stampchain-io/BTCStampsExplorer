export const getSecurityHeaders = (
  options: { forceNoCache?: boolean } = {},
) => {
  const cacheControl = options.forceNoCache
    ? "no-store, must-revalidate"
    : "public, max-age=31536000, immutable";

  return {
    // Less restrictive CSP
    "Content-Security-Policy": [
      "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
      "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
      "style-src * 'unsafe-inline'",
      "img-src * data: blob:",
      "font-src * data: blob:",
      "connect-src * data: blob:",
      "frame-ancestors *",
      "frame-src *",
      "worker-src * blob:",
    ].join("; "),

    // Rest of headers remain the same
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Cloudflare-CDN-Cache-Control": cacheControl,
    "Surrogate-Control": options.forceNoCache ? "no-store" : "max-age=31536000",
    "Edge-Control": options.forceNoCache ? "no-store" : "cache-maxage=31536000",
    // Recursive stamp headers
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Vary": "Accept-Encoding, Accept, Origin",
  };
};

export const getHtmlHeaders = (options?: { forceNoCache?: boolean }) => {
  const baseHeaders = getSecurityHeaders(options);

  return {
    ...baseHeaders,
    "Content-Type": "text/html; charset=utf-8",
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
  };
};

// JavaScript content headers - using same permissive CSP
export const getJavaScriptHeaders = (options?: { forceNoCache?: boolean }) => ({
  ...getSecurityHeaders(options),
  "Content-Type": "application/javascript; charset=utf-8",
});

// Image content headers - using same permissive CSP
export const getImageHeaders = (options?: { forceNoCache?: boolean }) => ({
  ...getSecurityHeaders(options),
  "Content-Type": "image/png",
});

// Add a new function for recursive content headers
export const getRecursiveHeaders = (options?: { forceNoCache?: boolean }) => ({
  "Content-Security-Policy": [
    "default-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
    "script-src * 'unsafe-inline' 'unsafe-eval' data: blob:",
    "style-src * 'unsafe-inline'",
    "img-src * data: blob:",
    "connect-src * data: blob:",
    "frame-ancestors *",
    "frame-src *",
    "worker-src * blob:",
  ].join("; "),
  // Cache headers
  "Cache-Control": options?.forceNoCache
    ? "no-store, must-revalidate"
    : "public, max-age=31536000, immutable",
  // CORS headers
  "Cross-Origin-Resource-Policy": "cross-origin",
  "Cross-Origin-Embedder-Policy": "unsafe-none",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Vary": "Accept-Encoding",
  // Prevent Quirks Mode
  // "X-Content-Type-Options": "nosniff",
});
