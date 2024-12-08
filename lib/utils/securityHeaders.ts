export const getSecurityHeaders = (
  options: { forceNoCache?: boolean } = {},
) => {
  const cacheControl = options.forceNoCache
    ? "no-store, must-revalidate"
    : "public, max-age=31536000, immutable";

  // Define trusted domains for main site
  const trustedDomains = [
    "'self'",
    "*.stampchain.io",
    "*.bitcoinstamps.xyz",
    "*.cloudflareinsights.com",
    "*.cloudflare.com",
    "*.esm.sh",
  ];

  return {
    "Content-Security-Policy": [
      `default-src ${
        trustedDomains.join(" ")
      } 'unsafe-inline' 'unsafe-eval' data: blob:`,
      `script-src ${
        trustedDomains.join(" ")
      } 'unsafe-inline' 'unsafe-eval' data: blob:`,
      `connect-src ${trustedDomains.join(" ")} data: blob:`,
      "style-src * 'unsafe-inline'",
      "img-src * data: blob:",
      "font-src * data: blob:",
      "frame-ancestors 'self'",
      "frame-src 'self'",
      "worker-src 'self' blob:",
    ].join("; "),

    "Cache-Control": options.forceNoCache
      ? "no-store, must-revalidate"
      : cacheControl,
    "CDN-Cache-Control": options.forceNoCache
      ? "no-store, must-revalidate"
      : cacheControl,
    "Cloudflare-CDN-Cache-Control": options.forceNoCache
      ? "no-store, must-revalidate"
      : cacheControl,
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

// More permissive for recursive stamps and dynamic content
export const getRecursiveHeaders = (options?: { forceNoCache?: boolean }) => {
  return {
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
    // Cache headers
    "Cache-Control": options?.forceNoCache
      ? "no-store, must-revalidate"
      : "public, max-age=31536000, immutable",
    "CDN-Cache-Control": options?.forceNoCache
      ? "no-store, must-revalidate"
      : "public, max-age=31536000, immutable",
    "Cloudflare-CDN-Cache-Control": options?.forceNoCache
      ? "no-store, must-revalidate"
      : "public, max-age=31536000, immutable",
    // CORS headers for recursive content
    "Cross-Origin-Resource-Policy": "cross-origin",
    "Cross-Origin-Embedder-Policy": "unsafe-none",
    "Cross-Origin-Opener-Policy": "same-origin",
    "Vary": "Accept-Encoding, Accept, Origin",
  };
};

// New function for binary content (images, audio, video)
export const getBinaryContentHeaders = (
  mimeType: string,
  options?: { forceNoCache?: boolean },
) => {
  const baseHeaders = getSecurityHeaders(options);

  // Specific CSP for images that might be embedded
  if (mimeType.startsWith("image/")) {
    return {
      ...baseHeaders,
      "Content-Type": mimeType,
      "Content-Security-Policy": [
        "default-src 'none'", // Restrictive default
        "img-src 'self' data: blob:", // Allow embedding
        "frame-ancestors 'self' https://*.stampchain.io", // Allow embedding in our domains
        "connect-src 'none'", // No external connections
        "script-src 'none'", // No external scripts
        "style-src 'none'", // No external styles
      ].join("; "),
      // Keep CORS headers for embedding
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
    };
  }

  // Other binary types (audio/video)
  return {
    ...baseHeaders,
    "Content-Type": mimeType,
    "Content-Security-Policy": [
      "default-src 'none'",
      "media-src 'self'",
      "frame-ancestors 'self'",
    ].join("; "),
  };
};
