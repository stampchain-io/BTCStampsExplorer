/* ===== SRC20 REDIRECT ROUTE ===== */
import { Handlers } from "$fresh/server.ts";

/* ===== SERVER HANDLER ===== */
export const handler: Handlers = {
  GET(_req: Request, _ctx) {
    const headers = new Headers();
    headers.set("location", "/tools/src20/deploy");
    return new Response(null, {
      status: 307,
      headers,
    });
  },
};
