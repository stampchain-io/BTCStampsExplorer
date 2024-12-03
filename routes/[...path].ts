import { Handlers } from "$fresh/server.ts";
import { logger, LogNamespace } from "$lib/utils/logger.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const url = new URL(req.url);

    await logger.debug("content" as LogNamespace, {
      message: "Catch-all handler",
      path: url.pathname,
      state: ctx.state,
    });

    // Return 404 for unhandled content, script, and API routes
    if (
      url.pathname.startsWith("/content/") ||
      url.pathname.startsWith("/s/") ||
      url.pathname.startsWith("/api/")
    ) {
      return ctx.renderNotFound();
    }

    // Handle legacy redirects
    if (
      url.pathname === "/asset.html" ||
      url.pathname.startsWith("/asset.html")
    ) {
      const txHash = url.searchParams.get("tx_hash");
      const asset = url.searchParams.get("asset");
      const cpid = url.searchParams.get("cpid");
      const stampNumber = url.searchParams.get("stampNumber");

      let redirectPath = "/";

      if (txHash) {
        redirectPath = `/stamp/${txHash}`;
      } else if (asset || cpid) {
        redirectPath = `/stamp/${asset || cpid}`;
      } else if (stampNumber) {
        redirectPath = `/stamp/${stampNumber}`;
      }

      // Create a new URL for the redirect
      const newUrl = new URL(redirectPath, url.origin);

      // Copy all query parameters to the new URL
      url.searchParams.forEach((value, key) => {
        if (!["tx_hash", "asset", "cpid", "stampNumber"].includes(key)) {
          newUrl.searchParams.append(key, value);
        }
      });

      return new Response("", {
        status: 301,
        headers: { Location: redirectPath },
      });
    }

    if (url.pathname === "/" || url.pathname === "/home") {
      return new Response("", {
        status: 301,
        headers: { Location: "/home" },
      });
    }

    // Render 404 for any unhandled routes
    return ctx.renderNotFound();
  },
};
