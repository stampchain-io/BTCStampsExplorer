import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req: Request, _ctx) {
    const url = new URL(req.url);
    url.pathname = "/stamp";
    url.searchParams.set("type", "classic");
    return new Response(null, {
      status: 307,
      headers: { Location: url.toString() },
    });
  },
};
