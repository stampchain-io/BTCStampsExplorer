import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import { IdentHandlerContext, StampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: IdentHandlerContext,
): Promise<Response> => {
  const { ident } = ctx.params;
  if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
    return ResponseUtil.error(`Error: ident: ${ident} not found`, 404);
  }
  try {
    const client = await getClient();
    const data = await StampsClass.get_stamps(client, {
      type: "stamps",
      ident: ident.toUpperCase(),
    });
    const last_block = await CommonClass.get_last_block_with_client(client);
    const body: StampResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: data.rows[0], // Assuming get_stamps returns an array, we take the first (and only) element
    };
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error(
      `Error: stamps with ident: ${ident} not found`,
      500,
    );
  }
};
