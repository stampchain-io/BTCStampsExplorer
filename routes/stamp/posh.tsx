/* ===== POSH REDIRECT ROUTE ===== */
import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/webResponseUtil.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  GET(req) {
    const originalUrl = new URL(req.url);
    const homeUrl = new URL("/", originalUrl);
    homeUrl.searchParams.set("category", "posh");

    // Return a 302 redirect to the home page with the posh category param
    return WebResponseUtil.redirect(homeUrl.toString());
  },
};

/* ===== PAGE COMPONENT ===== */
export default function PoshRedirect() {
  /* ===== RENDER ===== */
  return null;
}
