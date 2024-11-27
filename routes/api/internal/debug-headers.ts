import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  GET(req) {
    // Only available in development
    if (Deno.env.get("DENO_ENV") !== "development") {
      return ResponseUtil.badRequest(
        "Debug endpoint only available in development",
      );
    }

    const headers = Object.fromEntries(req.headers.entries());
    const url = new URL(req.url);

    const debugInfo = {
      headers,
      url: {
        full: req.url,
        origin: url.origin,
        pathname: url.pathname,
        host: url.host,
      },
      important: {
        origin: req.headers.get("Origin"),
        referer: req.headers.get("Referer"),
        host: req.headers.get("Host"),
        forwarded: {
          proto: req.headers.get("X-Forwarded-Proto"),
          for: req.headers.get("X-Forwarded-For"),
          host: req.headers.get("X-Forwarded-Host"),
        },
        cloudflare: {
          visitor: req.headers.get("CF-Connecting-IP"),
          ipcountry: req.headers.get("CF-IPCountry"),
          ray: req.headers.get("CF-Ray"),
        },
      },
    };

    return ResponseUtil.success(debugInfo, {
      forceNoCache: true,
    });
  },
};
