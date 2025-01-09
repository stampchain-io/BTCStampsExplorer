import { FreshContext } from "$fresh/server.ts";

// Routes that should skip the app layout
const DIRECT_ROUTES = [
  "/content/",
  "/s/",
  "/api/",
  "/internal/",
  "/test/",
];

// Add response caching for static routes
const CACHED_ROUTES = [
  "/",
  "/presskit",
  "/termsofservice",
  "/privacy",
  "/about",
];

const API_ROUTES = ["/api/", "/s/", "/content/"];

const CACHE_DURATION = {
  YEAR: 31536000,
  DAY: 86400,
  HOUR: 3600,
  MINUTE: 60,
} as const;

function getBaseUrl(req: Request): string {
  if (Deno.env.get("DENO_ENV") === "development") {
    return Deno.env.get("DEV_BASE_URL") || "https://dev.stampchain.io";
  }
  return new URL(req.url).origin;
}

export async function handler(
  req: Request,
  ctx: FreshContext,
) {
  const startTime = performance.now();
  const url = new URL(req.url);
  ctx.state.baseUrl = getBaseUrl(req);

  if (API_ROUTES.some((prefix) => url.pathname.startsWith(prefix))) {
    return ctx.next();
  }
  // Base cache headers
  const cacheHeaders = {
    "Timing-Allow-Origin": "*",
    "Server-Timing": `start;dur=${performance.now() - startTime}`,
  };

  // Handle different caching scenarios
  if (url.pathname === "/home") {
    return new Response("", {
      status: 308,
      headers: {
        Location: "/",
        "Cache-Control": `public, max-age=${CACHE_DURATION.YEAR}`,
      },
    });
  }

  // CSS files get longest cache and specific content type
  if (url.pathname.endsWith(".css")) {
    ctx.state.responseInit = {
      headers: {
        ...cacheHeaders,
        "Cache-Control": `public, max-age=${CACHE_DURATION.YEAR}`,
        "Content-Type": "text/css",
      },
    };
  }

  // Font-specific caching
  if (url.pathname.includes("fonts.")) {
    ctx.state.responseInit = {
      headers: {
        ...cacheHeaders,
        "Cache-Control": `public, max-age=${CACHE_DURATION.YEAR}`,
      },
    };
  }

  // Root and other static routes
  if (CACHED_ROUTES.includes(url.pathname)) {
    ctx.state.responseInit = {
      headers: {
        ...cacheHeaders,
        "Cache-Control": `public, max-age=${CACHE_DURATION.HOUR}`,
      },
    };
  }

  // Direct route check
  if (DIRECT_ROUTES.some((prefix) => url.pathname.startsWith(prefix))) {
    ctx.state.skipAppLayout = true;
  }

  // Process request and add final timing
  const response = await ctx.next();
  const endTime = performance.now();
  const existingTiming = response.headers.get("Server-Timing") || "";

  response.headers.set(
    "Server-Timing",
    `${existingTiming}, total;dur=${endTime - startTime}`,
  );

  return response;
}
