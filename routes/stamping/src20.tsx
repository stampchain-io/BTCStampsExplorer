import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(_req: Request, ctx) {
    const headers = new Headers();
    headers.set("location", "/stamping/src20/deploy");
    return new Response(null, {
      status: 307,
      headers,
    });
  },
};
