import { Handlers } from "$fresh/server.ts";
import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      // Log the raw request body
      const rawBody = await req.text();
      console.log("Raw request body:", rawBody);

      // Parse the JSON
      const body: InputData = JSON.parse(rawBody);

      // Use the utility service
      const { UtilityService } = SRC20Service;
      await UtilityService.performChecks(body.op, body);

      // Use SRC20Service.TransactionService instead of direct import
      return await SRC20Service.TransactionService.handleOperation(
        body.op.toLowerCase(),
        body,
      );
    } catch (error) {
      console.error("Error processing request:", error);
      if (error instanceof SyntaxError) {
        return ResponseUtil.error("Invalid JSON in request body", 400);
      }
      return ResponseUtil.error(error.message, 400);
    }
  },
};
