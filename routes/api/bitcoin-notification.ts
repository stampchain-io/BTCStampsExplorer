import { Handlers } from "$fresh/server.ts";
import { dbManager } from "$lib/database/db.ts";

const API_KEY = Deno.env.get("API_KEY");

export const handler: Handlers = {
  async POST(req) {
    // Check for API key in the request headers
    const apiKey = req.headers.get("X-API-Key");

    if (apiKey !== API_KEY) {
      return new Response("Unauthorized", { status: 401 });
    }

    const data = await req.json();
    console.log("Received Bitcoin notification:", data);

    // Invalidate the cache
    // await dbManager.invalidateLastBlockCache();

    return new Response("OK", { status: 200 });
  },
};

// public async invalidateLastBlockCache(): Promise<void> {
//   if (this.redisClient) {
//     try {
//       await this.redisClient.del('last_block');
//       console.log('Last block cache invalidated');
//     } catch (error) {
//       console.error('Failed to invalidate last block cache:', error);
//     }
//   }
// }
