import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { convertEmojiToTick, convertToEmoji } from "utils/util.ts";
import { TickHandlerContext } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: TickHandlerContext,
): Promise<Response> => {
  let { tick } = ctx.params;
  try {
    tick = convertEmojiToTick(String(tick));

    const deploymentResponse = await Src20Controller
      .handleSrc20TransactionsRequest(_req, {
        tick: [tick],
        op: "DEPLOY",
        limit: 1,
        page: 1,
      });
    const deploymentData = await deploymentResponse.json();

    const mintStatusResponse = await Src20Controller
      .handleSrc20MintProgressRequest(tick);
    const mintStatusData = await mintStatusResponse.json();

    const lastBlockResponse = await Src20Controller
      .handleSrc20TransactionsRequest(_req, {
        limit: 1,
        page: 1,
        sort: "DESC",
      });
    const lastBlockData = await lastBlockResponse.json();

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
    return ResponseUtil.error(`Error: Internal server error`);
  }
};
