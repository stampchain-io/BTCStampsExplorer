import { Handlers } from "$fresh/server.ts";
import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { performChecks } from "utils/minting/src20/check.ts";
import { handleSRC20Operation } from "utils/minting/src20Handler.ts";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    const body: InputData = await req.json();

    try {
      performChecks(body.op, body);
    } catch (error) {
      return ResponseUtil.error(error.message, 400);
    }

    return await handleSRC20Operation(body.op.toLowerCase(), body);
  },
};
