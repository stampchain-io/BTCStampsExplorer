// 🚧 TEMPORARY TEST HANDLER - Remove after Horizon Wallet API discovery is complete
import { Handlers } from "$fresh/server.ts";

export const handler: Handlers = {
  async GET(_req, _ctx) {
    try {
      const htmlContent = await Deno.readTextFile(
        "./client/test/horizon-wallet-discovery.html",
      );

      return new Response(htmlContent, {
        headers: {
          "content-type": "text/html; charset=utf-8",
          "cache-control": "no-cache, no-store, must-revalidate",
          "pragma": "no-cache",
          "expires": "0",
        },
      });
    } catch (error: unknown) {
      console.error("Error serving horizon discovery HTML:", error);

      return new Response(
        `
        <html>
          <body style="font-family: monospace; padding: 20px; background: #1a1a1a; color: #ff4444;">
            <h1>🚧 Test File Not Found</h1>
            <p>Could not load horizon-wallet-discovery.html</p>
            <p>Error: ${
          error instanceof Error ? error.message : String(error)
        }</p>
            <p><a href="/test/horizon-discovery" style="color: #00aaff;">← Back to Discovery Page</a></p>
          </body>
        </html>
      `,
        {
          status: 404,
          headers: { "content-type": "text/html; charset=utf-8" },
        },
      );
    }
  },
};
