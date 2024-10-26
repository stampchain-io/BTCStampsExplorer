import { Handlers } from "$fresh/server.ts";
import { fetchQuicknode } from "$lib/utils/quicknode.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const name = url.searchParams.get("name");
    const paramsStr = url.searchParams.get("params");

    if (!name || !paramsStr) {
      return new Response(
        JSON.stringify({
          error: "Missing 'name' or 'params' query parameters",
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    try {
      const params = JSON.parse(paramsStr);
      const btcPrice = await fetchQuicknode(name, params);

      const usdPrice = btcPrice.result?.bitcoin?.usd ??
        btcPrice.result?.price ?? 0;

      return new Response(
        JSON.stringify({
          price: usdPrice,
          data: btcPrice.result,
        }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    } catch (error) {
      console.error("Error fetching from QuickNode:", error);
      return new Response(
        JSON.stringify({ error: "Failed to fetch BTC price" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
