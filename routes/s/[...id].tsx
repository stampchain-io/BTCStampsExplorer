import { connectDb, StampsClass } from "$lib/database/index.ts";
import { CommonClass } from "../../lib/database";
import * as base64 from "https://denopkg.com/chiefbiiko/base64/mod.ts";

export const handler: Handlers<StampRow> = {
  async GET(req: Request, ctx: HandlerContext) {   
    const { id } = ctx.params;
    const client = await connectDb();
    const file_name = await StampsClass
      .get_stamp_file_by_identifier_with_client(
        client,
        id as string,
      );
    // if the file doesnt exist, get the base64
    if (!file_name) {
      const issuance_data = await CommonClass
      .get_issuances_by_identifier_with_client(
        client,
        id as string,
      );
      // if the base64 exists, convert it to a uint8array and return it
      if(issuance_data.stamp_base64){
        return new Response(base64.toUint8Array(issuance_data.stamp_base64))        
      }
      // otherwise, 404
      else
        return ctx.renderNotFound();
    }
    client.close();
    return new Response("", {
      status: 301,
      headers: { Location: `/content/${file_name}` },
    });
  },
};