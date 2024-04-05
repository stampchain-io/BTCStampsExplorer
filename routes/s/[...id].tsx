import { getClient, StampsClass } from "$lib/database/index.ts";
import { api_get_stamp } from "$lib/controller/stamp.ts";
import { HandlerContext, Handlers } from "$fresh/server.ts";

import * as base64 from "base64/mod.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const params = url.searchParams.toString();
    const client = await getClient();
    const file_name = await StampsClass
      .get_stamp_file_by_identifier_with_client(
        client,
        id as string,
      );
    // if the file doesnt exist, get the base64
    if (file_name.indexOf(".unknown") > -1) {
      const res = await api_get_stamp(id);
      if (res.stamp.stamp_base64) {
        return new Response(base64.toUint8Array(res.stamp.stamp_base64));
      } // otherwise, 404
      else {
        return ctx.renderNotFound();
      }
    }
    return new Response("", {
      status: 301,
      headers: {
        Location: `/content/${file_name}${params ? `?${params}` : ""}`,
      },
    });
  },
};
