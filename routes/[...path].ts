import { Handlers } from "$fresh/server.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";

export const handler: Handlers = {
  GET(req, ctx) {
    const url = new URL(req.url);
    const pathname = url.pathname;

    // Handle legacy redirects first
    if (pathname === "/asset.html" || pathname.startsWith("/asset.html")) {
      return handleLegacyRedirect(url);
    }

    // Only handle unknown routes - don't interfere with existing routes
    // This catch-all should only handle paths that don't have their own route files
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

  return WebResponseUtil.redirect(redirectPath, 301);
}
