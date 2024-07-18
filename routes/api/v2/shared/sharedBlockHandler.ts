import { CommonClass, getClient } from "$lib/database/index.ts";
import {
  BlockHandlerContext,
  ErrorResponseBody,
  StampBlockResponseBody,
} from "globals";
import { releaseClient } from "$lib/database/db.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const sharedBlockHandler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const { block_index } = ctx.params;
  const blockIndexNumber = Number(block_index);

  if (!Number.isInteger(blockIndexNumber)) {
    const body: ErrorResponseBody = {
      error: `Invalid block_index: ${block_index}. It must be an integer.`,
    };
    return ResponseUtil.error(body.error, 400);
  }

  const client = await getClient();
  if (!client) {
    const body: ErrorResponseBody = { error: "Could not connect to database" };
    return ResponseUtil.error(body.error, 500);
  }

  const isStamps = ctx.url.pathname.includes("/stamps/");
  const type = isStamps ? "stamps" : "cursed";

  try {
    const [block_info, last_block, data] = await Promise.all([
      CommonClass.get_block_info_with_client(client, blockIndexNumber),
      CommonClass.get_last_block_with_client(client),
      CommonClass.get_stamps_by_block_with_client(
        client,
        blockIndexNumber,
        type,
      ),
    ]);

    const body: StampBlockResponseBody = {
      last_block: last_block.rows[0].last_block,
      block_info: block_info.rows[0],
      data: data.rows,
    };

    return ResponseUtil.success(body);
  } catch (error) {
    console.error(`Error in ${type}/block handler:`, error);
    const body: ErrorResponseBody = {
      error: `Block: ${block_index} not found`,
    };
    return ResponseUtil.error(body.error, 404);
  } finally {
    releaseClient(client);
  }
};
