import { Handlers } from "$fresh/server.ts";
import { BlockController } from "$lib/controller/blockController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { number } = ctx.params;
    const parsedNumber = number ? parseInt(number) : 100;

    if (Number.isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 100) {
      return ResponseUtil.error(
        "Invalid number provided. Must be a number between 1 and 100.",
        400,
      );
    }

    try {
      const lastBlocks = await BlockController.getLastXBlocks(parsedNumber);
      return ResponseUtil.success(lastBlocks);
    } catch (error) {
      console.error("Failed to get last blocks:", error);
      return ResponseUtil.error("Internal server error", 500);
    }
  },
};
