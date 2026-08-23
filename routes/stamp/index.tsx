/* ===== STAMP OVERVIEW REDIRECT ===== */
/* The Stamp Overview page was superseded by /explorer. This route now
 * permanently redirects legacy /stamp traffic (bookmarks, sitemap crawlers,
 * inbound links) to the Explorer page instead of 404ing. */

import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);
    const redirectUrl = new URL("/explorer", url.origin);
    redirectUrl.search = url.search;
    return WebResponseUtil.redirect(
      redirectUrl.pathname + redirectUrl.search,
      301,
    );
  },
};
