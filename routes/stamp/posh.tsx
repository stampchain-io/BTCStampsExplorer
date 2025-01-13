import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/webResponseUtil.ts";

export const handler: Handlers = {
  GET(req) {
    const originalUrl = new URL(req.url);
    const homeUrl = new URL("/", originalUrl);
    homeUrl.searchParams.set("category", "posh");

    // Return a 302 redirect to the home page with the posh category param
    return WebResponseUtil.redirect(homeUrl.toString());
  },
};

export default function PoshRedirect() {
  // During the GET request, user is immediately redirected.
  // No actual UI for this page.
  return null;
}
