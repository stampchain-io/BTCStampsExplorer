import { CommonClass, getClient } from "$lib/database/index.ts";
import { api_get_stamp_all_data } from "$lib/controller/stamp.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampResponseBody,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const getStampByIdOrIdentifier = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const client = await getClient();
    const data = await api_get_stamp_all_data(id);
    let last_block;
    if (client) {
      last_block = await CommonClass.get_last_block_with_client(client);
    }
    if (!data) {
      throw new Error("Stamp not found");
    }
    const body: StampResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: data,
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return ResponseUtil.error(body.error, 500);
  }
};
