import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { convertEmojiToTick, convertToEmoji } from "utils/util.ts";
import { TickHandlerContext } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  req: Request,
  ctx: TickHandlerContext,
): Promise<Response> => {
  try {
    const tick = convertEmojiToTick(String(ctx.params.tick));

    const [deploymentResponse, mintStatusResponse, lastBlockResponse] =
      await Promise.all([
        Src20Controller.handleSrc20TransactionsRequest(req, {
          tick: [tick],
          op: "DEPLOY",
          limit: 1,
          page: 1,
        }),
        Src20Controller.handleSrc20MintProgressRequest(tick),
        Src20Controller.handleSrc20TransactionsRequest(req, {
          limit: 1,
          page: 1,
          sort: "DESC",
        }),
      ]);

    const [deploymentData, mintStatusData, lastBlockData] = await Promise.all([
      deploymentResponse,
      mintStatusResponse,
      lastBlockResponse,
    ]);

    const body = {
      last_block: lastBlockData.last_block,
      mint_status: mintStatusData,
      data: {
        ...deploymentData.data[0],
        tick: convertToEmoji(deploymentData.data[0].tick),
      },
    };

    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in deploy handler:", error);
    return ResponseUtil.handleError(error, "Internal server error");
  }
};
