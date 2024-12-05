import { FreshContext } from "$fresh/server.ts";
import { logger } from "$lib/utils/logger.ts";

// Routes that should skip the app layout
const DIRECT_ROUTES = [
  "/content/",
  "/s/",
  "/api/",
];

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
  const url = new URL(req.url);
  ctx.state.baseUrl = getBaseUrl(req);

  logger.debug("stamps", {
    message: "Setting base URL",
    baseUrl: ctx.state.baseUrl,
    env: Deno.env.get("DENO_ENV"),
  });

  // Check if route should skip app layout
  const isDirectRoute = DIRECT_ROUTES.some((prefix) =>
    url.pathname.startsWith(prefix)
  );
  if (isDirectRoute) {
    ctx.state.skipAppLayout = true;
    return ctx.next();
  }

  if (url.pathname === "/") {
    return ctx.render();
  }

  return ctx.next();
}
