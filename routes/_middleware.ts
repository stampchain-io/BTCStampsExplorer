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
const CACHED_ROUTES = ["/"];

function getBaseUrl(req: Request): string {
  if (Deno.env.get("DENO_ENV") === "development") {
    return Deno.env.get("DEV_BASE_URL") || "https://bitcoinstamps.xyz";
  }
  return new URL(req.url).origin;
}

export function handler(
  req: Request,
  ctx: FreshContext,
) {
  const startTime = performance.now();
  const url = new URL(req.url);
  ctx.state.baseUrl = getBaseUrl(req);

  // Redirect /home to root with proper caching headers
  if (url.pathname === "/home") {
    return new Response("", {
      status: 308, // Permanent redirect
      headers: {
        Location: "/",
        "Cache-Control": "public, max-age=31536000", // Cache redirect for 1 year
      },
    });
  }

  // Add cache headers for static routes
  if (CACHED_ROUTES.includes(url.pathname)) {
    ctx.state.responseInit = {
      headers: {
        "Cache-Control": "public, max-age=3600",
        "Timing-Allow-Origin": "*",
        "Server-Timing": `route;dur=${performance.now() - startTime}`,
      },
    };
  }

  // Direct route check
  if (DIRECT_ROUTES.some((prefix) => url.pathname.startsWith(prefix))) {
    ctx.state.skipAppLayout = true;
    return ctx.next();
  }

  return ctx.next();
}
