import { StampController } from "$lib/controller/stampController.ts";
import { Handlers } from "$fresh/server.ts";
import { StampRow } from "globals";
import * as base64 from "base64/mod.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    const result = await StampController.getStampFile(id as string);

    if (result.type === "redirect") {
      return new Response("", {
        status: 301,
        headers: {
          Location: `/content/${result.fileName}${params ? `?${params}` : ""}`,
        },
      });
    } else if (result.type === "base64") {
      return new Response(base64.toUint8Array(result.base64));
    } else {
      return ctx.renderNotFound();
    }
  },
};
