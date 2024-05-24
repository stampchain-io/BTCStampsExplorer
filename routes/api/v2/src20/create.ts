import {
  deploySRC20,
  mintSRC20,
  transferSRC20,
} from "utils/minting/src20/index.ts";
import { HandlerContext, Handlers } from "$fresh/server.ts";
import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts"; // Import the responseUtil helper

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: HandlerContext) {
    const body: InputData = await req.json();

    if (body.op.toLowerCase() === "deploy") {
      const hex = await deploySRC20({
        toAddress: body.toAddress,
        changeAddress: body.changeAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        max: body.max,
        lim: body.lim,
        dec: body.dec,
      });
      if (hex === null) {
        return ResponseUtil.error(
          `Error: Tick ${body.tick} already exists or error generating tx`,
          400,
        );
      }
      return ResponseUtil.success(hex);
    }

    if (body.op.toLowerCase() === "mint") {
      const hex = await mintSRC20({
        toAddress: body.toAddress,
        changeAddress: body.changeAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        amt: body.amt,
      });
      return ResponseUtil.success(hex);
    }

    if (body.op.toLowerCase() === "transfer") {
      if (!body.fromAddress) {
        return ResponseUtil.error(
          "Error: fromAddress is required for transfer operation",
          400,
        );
      }
      const hex = await transferSRC20({
        toAddress: body.toAddress,
        fromAddress: body.fromAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        amt: body.amt,
      });
      return ResponseUtil.success(hex);
    }

    return ResponseUtil.error("Invalid operation", 400);
  },
};
