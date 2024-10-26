import { Handlers } from "$fresh/server.ts";
import { StampController } from "$server/controller/stampController.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    if (!address) {
      return new Response("Address is required", { status: 400 });
    }

    try {
      const creatorName = await StampController.getCreatorNameByAddress(
        address,
      );
      return new Response(JSON.stringify({ creatorName }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error fetching creator name:", error);
      return new Response("Internal Server Error", { status: 500 });
    }
  },
};
