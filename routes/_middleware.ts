import { FreshContext } from "$fresh/server.ts";

// Routes that should skip the app layout
const DIRECT_ROUTES = [
  "/content/",
  "/s/",
  "/api/",
];

export function handler(
  req: Request,
  ctx: FreshContext,
) {
  const url = new URL(req.url);

  // Check if route should skip app layout
  const isDirectRoute = DIRECT_ROUTES.some((prefix) =>
    url.pathname.startsWith(prefix)
  );
  if (isDirectRoute) {
    ctx.state.skipAppLayout = true;
    return ctx.next();
  }

  if (url.pathname === "/") {
    return new Response("", {
      status: 301,
      headers: { Location: "/home" },
    });
  }

  return ctx.next();
}
