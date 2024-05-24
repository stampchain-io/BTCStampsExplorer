import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
import { BlockHandlerContext, StampBlockResponseBody } from "globals";
import { releaseClient } from "$lib/database/db.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const { block_index } = ctx.params;

  const blockIndexNumber = Number(block_index);
  if (!Number.isInteger(blockIndexNumber)) {
    return ResponseUtil.error(
      `Invalid block_index: ${block_index}. It must be an integer.`,
      400,
    );
  }

  try {
    const client = await getClient();
    const block_info = await CommonClass.get_block_info_with_client(
      client,
      blockIndexNumber,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const data = await StampsClass.get_stamps_by_block_index_with_client(
      client,
      blockIndexNumber,
    );

    const body: StampBlockResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      block_info: block_info.rows[0],
      data: data.rows,
    };
    releaseClient(client);
    return ResponseUtil.success(body);
  } catch {
    return ResponseUtil.error(`Block: ${block_index} not found`, 404);
  }
};
