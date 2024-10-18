import { StampController } from "$lib/controller/stampController.ts";
import { Handlers } from "$fresh/server.ts";
import { StampRow } from "globals";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    try {
      const result = await StampController.getStampFile(id as string, params);
      return result;
    } catch (error) {
      console.error(`Error processing stamp file request for id ${id}:`, error);
      return new Response(null, {
        status: 500,
        headers: { "X-Error": "Internal Server Error" },
      });
    }
  },
};
