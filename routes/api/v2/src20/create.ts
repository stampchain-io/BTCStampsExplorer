import { Handlers } from "$fresh/server.ts";
import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { performChecks } from "utils/minting/src20/check.ts";
import { handleSRC20Operation } from "utils/minting/src20Handler.ts";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      // Log the raw request body
      const rawBody = await req.text();
      console.log("Raw request body:", rawBody);

      // Parse the JSON
      const body: InputData = JSON.parse(rawBody);

      // Perform checks
      performChecks(body.op, body);

      // Handle the operation
      return await handleSRC20Operation(body.op.toLowerCase(), body);
    } catch (error) {
      console.error("Error processing request:", error);
      if (error instanceof SyntaxError) {
        return ResponseUtil.error("Invalid JSON in request body", 400);
      }
      return ResponseUtil.error(error.message, 400);
    }
  },
};
