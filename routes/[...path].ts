import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  GET(req) {
    const url = new URL(req.url);

    // Exclude API routes
    if (url.pathname.startsWith("/api/")) {
      return new Response("Not Found", { status: 404 });
    }

    // Check if the URL matches the old pattern or is the asset.html page
    if (
      url.pathname === "/asset.html" || url.pathname.startsWith("/asset.html")
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
        headers: { Location: newUrl.toString() },
      });
    }

    // For any other unmatched routes, redirect to the home page or show a 404
    return new Response("", {
      status: 301,
      headers: { Location: "/" },
    });
  },
};
