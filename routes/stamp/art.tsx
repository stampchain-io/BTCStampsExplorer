import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/webResponseUtil.ts";

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    url.pathname = "/stamp";
    url.searchParams.set("type", "classic");

    return WebResponseUtil.redirect(url.toString(), 307);
  },
};

export default function ArtRedirect() {
  return null;
}
