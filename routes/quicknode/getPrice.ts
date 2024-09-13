import { Handlers } from "$fresh/server.ts";
import { fetchQuicknode } from "utils/quicknode.ts";

export const handler: Handlers = {
  async POST(req) {
    const { name, params } = await req.json();
    try {
      const stampBalance = await fetchQuicknode(name, params);
      return new Response(
        JSON.stringify({ price: stampBalance.result.bitcoin.usd }),
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
