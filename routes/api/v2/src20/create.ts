import { deploySRC20 } from "utils/minting/src20.ts";

interface TX {
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

export const handler: Handlers<TX | null> = {
  async POST(req, ctx) {
    const body: inputData = await req.json();
    console.log(body);
    if (body.op.toLowerCase() === "deploy") {
      const response = await deploySRC20({
        toAddress: body.toAddress,
        changeAddress: body.changeAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        max: body.max,
        lim: body.lim,
        dec: body.dec,
      });
      return new Response(JSON.stringify(response));
    }
  },
};
