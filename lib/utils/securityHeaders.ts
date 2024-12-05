export const getSecurityHeaders = (
  options: { forceNoCache?: boolean } = {},
) => {
  const cacheControl = options.forceNoCache
    ? "no-store, must-revalidate"
    : "public, max-age=31536000, immutable";

  return {
    // Optimize CSP
    "Content-Security-Policy": [
      "default-src 'self' *.bitcoinstamps.xyz *.stampchain.io",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' *.bitcoinstamps.xyz *.stampchain.io",
      "style-src 'self' 'unsafe-inline' fonts.googleapis.com",
      "img-src 'self' data: blob: *.bitcoinstamps.xyz *.stampchain.io",
      "font-src 'self' fonts.gstatic.com",
      "connect-src 'self' *.bitcoinstamps.xyz *.stampchain.io",
      "frame-ancestors 'self' *.bitcoinstamps.xyz *.stampchain.io",
    ].join("; "),

    // Optimized cache headers
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Cloudflare-CDN-Cache-Control": cacheControl,
    "Surrogate-Control": options.forceNoCache ? "no-store" : "max-age=31536000",
    "Edge-Control": options.forceNoCache ? "no-store" : "cache-maxage=31536000",

    // Security headers
    // "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
    // "X-Content-Type-Options": "nosniff",
    // "X-Frame-Options": "SAMEORIGIN",
    // "Referrer-Policy": "strict-origin-when-cross-origin",

    // Vary header for proper cache keys
    "Vary": "Accept-Encoding, Accept, Origin",
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
