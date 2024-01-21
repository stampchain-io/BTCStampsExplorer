import {
  deploySRC20,
  mintSRC20,
  transferSRC20,
} from "utils/minting/src20/index.ts";
import { HandlerContext, Handlers } from "$fresh/runtime.ts";
import { InputData, TX, TXError } from "globals";

/**
 * @swagger
 * /api/v2/src20/create:
 *   post:
 *     summary: Create a new SRC20 token or mint additional tokens.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/InputData'
 *     responses:
 *       '200':
 *         description: Successful response with the hex value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hex:
 *                   type: string
 *                   description: The hex value.
 *       '400':
 *         description: Bad request error response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 */

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
        return new Response(JSON.stringify({
          error:
            `Error: Tick ${body.tick} already exists or error generating tx`,
        }));
      }
      return new Response(JSON.stringify({
        ...hex,
      }));
    }

    if (body.op.toLowerCase() === "mint") {
      const hex = await mintSRC20({
        toAddress: body.toAddress,
        changeAddress: body.changeAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        amt: body.amt,
      });
      return new Response(JSON.stringify({
        ...hex,
      }));
    }

    if (body.op.toLowerCase() === "transfer") {
      const hex = await transferSRC20({
        toAddress: body.toAddress,
        fromAddress: body.fromAddress,
        tick: body.tick,
        feeRate: body.feeRate,
        amt: body.amt,
      });
      return new Response(JSON.stringify({
        ...hex,
      }));
    }
  },
};
