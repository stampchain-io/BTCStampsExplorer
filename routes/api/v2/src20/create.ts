import { deploySRC20 } from "utils/minting/src20/index.ts";
import { HandlerContext, Handlers } from "$fresh/runtime.ts";

interface TX {
  hex: string;
}
interface TXError {
  error: string;
}

interface inputData {
  op: string;
  toAddress: string;
  changeAddress: string;
  tick: string;
  feeRate: number;
  max?: number | string;
  lim?: number | string;
  dec?: number;
  amt?: number | string;
}

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: HandlerContext) {
    const body: inputData = await req.json();
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
        return new Response(JSON.stringify({
          error:
            `Error: Tick ${body.tick} already exists or error generating tx`,
        }));
      }
      return new Response(JSON.stringify({
        hex,
      }));
    }

    if (body.op.toLowerCase() === "mint") {
      const hex = await deploySRC20({
        toAddress: body.toAddress,
        changeAddress: body.changeAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        max: body.max,
        lim: body.lim,
        dec: body.dec,
      });
      return new Response(JSON.stringify({
        hex,
      }));
    }
  },
};
