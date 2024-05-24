import { CommonClass, getClient } from "$lib/database/index.ts";
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
    );
  }

  try {
    const client = await getClient();
    const block_info = await CommonClass.get_block_info_with_client(
      client,
      blockIndexNumber,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const cursed = await CommonClass.get_stamps_by_block_with_client(
      client,
      blockIndexNumber,
      "cursed",
    );

    const body: StampBlockResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      block_info: block_info.rows[0],
      data: cursed.rows,
    };
    releaseClient(client);
    return ResponseUtil.success(body);
  } catch (_error) {
    return ResponseUtil.error(`Block: ${block_index} not found`, 404);
  }
};
