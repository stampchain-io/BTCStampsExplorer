import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Skip handling for home routes
    if (pathname === "/" || pathname === "/home") {
      return ctx.next();
    }

    // Early return for known unhandled routes
    if (
      pathname.startsWith("/content/") ||
      pathname.startsWith("/s/") ||
      pathname.startsWith("/api/")
    ) {
      return ctx.renderNotFound();
    }

    // Handle legacy redirects more efficiently
    if (pathname === "/asset.html" || pathname.startsWith("/asset.html")) {
      return handleLegacyRedirect(url);
    }

    return ctx.renderNotFound();
  },
};

function handleLegacyRedirect(url: URL): Response {
  const params = {
    txHash: url.searchParams.get("tx_hash"),
    asset: url.searchParams.get("asset"),
    cpid: url.searchParams.get("cpid"),
    stampNumber: url.searchParams.get("stampNumber"),
  };

  let redirectPath = "/";

  if (params.txHash) {
    redirectPath = `/stamp/${params.txHash}`;
  } else if (params.asset || params.cpid) {
    redirectPath = `/stamp/${params.asset || params.cpid}`;
  } else if (params.stampNumber) {
    redirectPath = `/stamp/${params.stampNumber}`;
  }

  return new Response("", {
    status: 301,
    headers: { Location: redirectPath },
  });
}
