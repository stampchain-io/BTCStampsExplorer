import { Handlers } from "$fresh/server.ts";
import { generateCSRFToken } from "$lib/utils/securityUtils.ts";

export const handler: Handlers = {
  async GET(_req) {
    try {
      const token = await generateCSRFToken();
      return new Response(JSON.stringify({ token }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error generating CSRF token:", error);
      return new Response(
        JSON.stringify({ error: "Failed to generate CSRF token" }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }
  },
};
