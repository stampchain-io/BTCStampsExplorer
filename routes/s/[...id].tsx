import { StampController } from "$lib/controller/stampController.ts";
import { Handlers } from "$fresh/server.ts";
import { StampFileResult, StampRow } from "globals";
import * as base64 from "base64/mod.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const params = url.searchParams.toString();

    try {
      const result = await StampController.getStampFile(id as string);

      if (!result) {
        return redirectToNotAvailable();
      }

      switch (result.type) {
        case "redirect":
          return new Response("", {
            status: 301,
            headers: {
              Location: `/content/${result.fileName}${
                params ? `?${params}` : ""
              }`,
            },
          });
        case "base64":
          return new Response(base64.toUint8Array(result.base64), {
            headers: {
              "Content-Type": result.mimeType || "application/octet-stream",
            },
          });
        default:
          return ctx.renderNotFound();
      }
    } catch (error) {
      console.error(`Error processing stamp file request for id ${id}:`, error);
      return ctx.render(null, {
        status: 500,
        headers: { "X-Error": "Internal Server Error" },
      });
    }
  },
};

function redirectToNotAvailable(): Response {
  return new Response("", {
    status: 301,
    headers: {
      Location: `/content/not-available.png`,
    },
  });
}
