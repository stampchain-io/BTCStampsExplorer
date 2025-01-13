import { normalizeHeaders } from "$lib/utils/headerUtils.ts";

export const getSecurityHeaders = (
  options: { forceNoCache?: boolean; context?: "api" | "web" | "recursive" } =
    {},
) => {
  const { forceNoCache, context = "web" } = options;
  const cacheControl = forceNoCache
    ? "no-store, must-revalidate"
    : "public, max-age=31536000, immutable";

  // Base trusted domains
  const trustedDomains = [
    "'self'",
    "*.stampchain.io",
    "*.bitcoinstamps.xyz",
    "*.cloudflareinsights.com",
    "*.cloudflare.com",
    "*.esm.sh",
  ];

  // Context-specific CSP policies
  const cspPolicies = {
    api: {
      // Most restrictive CSP for API endpoints
      defaultSrc: ["'none'"], // Block all resources by default
      connectSrc: ["'self'"], // Allow same-origin XHR/fetch
      // Remove unnecessary directives for APIs:
      // - No need for frameSrc (APIs aren't framed)
      // - No need for frameAncestors (APIs aren't embedded)
      // - No need for imgSrc (APIs don't serve images directly)
      // - No need for scriptSrc (APIs don't need client-side scripts)
      // - No need for styleSrc (APIs don't need CSS)
    },
    web: {
      defaultSrc: [...trustedDomains], // Allow resources from trusted domains
      scriptSrc: [ // Script execution sources
        ...trustedDomains,
        "'unsafe-inline'", // Allow inline scripts (needed for Fresh)
        "'unsafe-eval'", // Allow dynamic code evaluation
      ],
      connectSrc: [...trustedDomains], // API/fetch destinations
      styleSrc: [ // Style sources
        "*", // Allow styles from any domain
        "'unsafe-inline'", // Allow inline styles (needed for Tailwind)
      ],
      imgSrc: [ // Image sources
        "*", // Allow images from any domain
        "data:", // Allow data: URIs for images
        "blob:", // Allow blob: URIs for dynamic images
      ],
      fontSrc: [ // Font sources
        "*", // Allow fonts from any domain
        "data:", // Allow data: URIs for fonts
        "blob:", // Allow blob: URIs for dynamic fonts
      ],
      frameAncestors: ["'self'"], // Only allow embedding in same origin
      frameSrc: ["'self'"], // Only allow iframes from same origin
      workerSrc: [ // Web Worker sources
        "'self'", // Allow workers from same origin
        "blob:", // Allow blob: URIs for dynamic workers
      ],
    },
    recursive: {
      // Permissive policy for recursive stamps that need to render arbitrary content
      defaultSrc: [ // Allow all sources by default
        "*", // Any domain
        "'unsafe-inline'", // Inline resources
        "'unsafe-eval'", // Dynamic code
        "data:", // Data URIs
        "blob:", // Blob URIs
      ],
      scriptSrc: [ // Maximum script flexibility
        "*",
        "'unsafe-inline'",
        "'unsafe-eval'",
        "data:",
        "blob:",
      ],
      styleSrc: ["*", "'unsafe-inline'"], // Allow any styles
      imgSrc: ["*", "data:", "blob:"], // Allow any images
      fontSrc: ["*", "data:", "blob:"], // Allow any fonts
      connectSrc: ["*", "data:", "blob:"], // Allow any connections
      frameAncestors: ["*"], // Allow embedding anywhere
      frameSrc: ["*"], // Allow any iframes
      workerSrc: ["*", "blob:"], // Allow any workers
    },
  };

  const selectedPolicy = cspPolicies[context];
  const cspHeader = Object.entries(selectedPolicy)
    .map(([key, values]) => {
      const directive = key.replace(/[A-Z]/g, (m) => `-${m.toLowerCase()}`);
      return `${directive} ${values.join(" ")}`;
    })
    .join("; ");

  return {
    "Content-Security-Policy": cspHeader,
    "Cache-Control": cacheControl,
    "CDN-Cache-Control": cacheControl,
    "Cloudflare-CDN-Cache-Control": cacheControl,
    "Surrogate-Control": forceNoCache ? "no-store" : "max-age=31536000",
    "Edge-Control": forceNoCache ? "no-store" : "cache-maxage=31536000",
    // CORS headers based on context
    ...(context === "recursive" && {
      "Cross-Origin-Resource-Policy": "cross-origin",
      "Cross-Origin-Embedder-Policy": "unsafe-none",
      "Cross-Origin-Opener-Policy": "same-origin",
    }),
    "Vary": "Accept-Encoding, Accept, Origin",
  };
};

export const getHtmlHeaders = (options?: { forceNoCache?: boolean }) =>
  normalizeHeaders({
    ...getSecurityHeaders({ ...options, context: "web" }),
    "Content-Type": "text/html; charset=utf-8",
  });

export const getRecursiveHeaders = (options?: { forceNoCache?: boolean }) =>
  normalizeHeaders(getSecurityHeaders({ ...options, context: "recursive" }));

export const getBinaryContentHeaders = (
  mimeType: string,
  options?: { forceNoCache?: boolean },
) =>
  normalizeHeaders({
    ...getSecurityHeaders({ ...options, context: "recursive" }),
    "Content-Type": mimeType,
  });
