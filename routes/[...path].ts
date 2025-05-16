import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Skip handling for known routes
    if (
      // Home routes
      pathname === "/" ||
      pathname === "/home" ||
      // Fresh.js internal paths - MUST be allowed to pass through
      pathname.startsWith("/_frsh/") ||
      // Main application routes
      pathname.startsWith("/stamp/") ||
      pathname.startsWith("/src20/") ||
      pathname.startsWith("/block/") ||
      pathname.startsWith("/explorer/") ||
      pathname.startsWith("/collection/") ||
      pathname.startsWith("/wallet/") ||
      pathname.startsWith("/dashboard/") ||
      pathname.startsWith("/tool/") ||
      pathname.startsWith("/howto/") ||
      pathname.startsWith("/faq/") ||
      pathname.startsWith("/about/") ||
      pathname.startsWith("/termsofservice/") ||
      pathname.startsWith("/docs/") ||
      pathname.startsWith("/presskit/") ||
      pathname.startsWith("/media/") ||
      pathname === "/upload"
    ) {
      return ctx.next();
    }

    // Early return for known API routes
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
