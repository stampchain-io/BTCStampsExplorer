export const getSecurityHeaders = (
  options: { forceNoCache?: boolean } = {},
) => {
  const cacheControl = options.forceNoCache
    ? "no-store, must-revalidate"
    : "public, max-age=31536000, immutable"; // Cache for 1 year

  return {
    // CSP Header - using the permissive settings that work for recursive content
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

    // Cache Control
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Cloudflare-CDN-Cache-Control": cacheControl,
    "Surrogate-Control": "max-age=31536000",

    // CORS Headers - matching responseUtil.ts
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Vary": "Accept-Encoding",
  };
};

// HTML content headers - using same permissive CSP
export const getHtmlHeaders = (options?: { forceNoCache?: boolean }) => {
  const baseHeaders = getSecurityHeaders(options); // Ensure baseHeaders is defined
  const frameAncestors =
    "frame-ancestors 'self' https://dev.bitcoinstamps.xyz https://bitcoinstamps.xyz https://stampchain.io";

  // Combine the base CSP with frame-ancestors instead of overwriting
  const combinedCsp = baseHeaders["Content-Security-Policy"].split(";")
    .filter((directive) => !directive.trim().startsWith("frame-ancestors"))
    .concat([frameAncestors])
    .join("; ");

  return {
    ...baseHeaders,
    "Content-Type": "text/html; charset=utf-8",
    "X-Frame-Options":
      "ALLOW-FROM https://dev.bitcoinstamps.xyz https://bitcoinstamps.xyz https://stampchain.io",
    "Content-Security-Policy": combinedCsp,
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
