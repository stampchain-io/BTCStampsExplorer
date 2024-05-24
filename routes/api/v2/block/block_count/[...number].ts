import { CommonClass, getClient } from "$lib/database/index.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: { params: { number: string } },
): Promise<Response> => {
  const { number } = ctx.params;
  const parsedNumber = number ? parseInt(number) : 1;

  if (Number.isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 100) {
    return ResponseUtil.error(
      "Invalid number provided. Must be a number between 1 and 100.",
    );
  }

  try {
    const client = await getClient();
    const lastBlocks = await CommonClass.get_last_x_blocks_with_client(
      client,
      parsedNumber,
    );
    return ResponseUtil.success({ blocks: lastBlocks });
  } catch (error) {
    console.error("Failed to get last blocks:", error);
    return ResponseUtil.error("Blocks not found", 404);
  }
};
