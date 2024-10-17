import { Handlers } from "$fresh/server.ts";
import { getClientConfig } from "$server/config/config.ts";

export const handler: Handlers = {
  GET(_req) {
    const clientConfig = getClientConfig();
    return new Response(JSON.stringify(clientConfig), {
      headers: { "Content-Type": "application/json" },
    });
  },
};
