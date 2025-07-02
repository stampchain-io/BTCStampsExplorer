import { Handlers } from "$fresh/server.ts";
import { TX, TXError } from "$globals";
import { SRC20Service } from "$server/services/src20/index.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, ctx) {
    try {
      const operation = ctx.params.operation?.toLowerCase();
      if (!["deploy", "mint", "transfer"].includes(operation)) {
        return ApiResponseUtil.badRequest("Invalid operation");
      }

      const body = await req.json();

      // Call the appropriate multisig operation
      let result;
      switch (operation) {
        case "deploy":
          result = await SRC20Service.OperationService.deploySRC20({
            ...body,
            trxType: "multisig",
          });
          break;
        case "mint":
          result = await SRC20Service.OperationService.mintSRC20({
            ...body,
            trxType: "multisig",
          });
          break;
        case "transfer":
          result = await SRC20Service.OperationService.transferSRC20({
            ...body,
            trxType: "multisig",
          });
          break;
      }

      if (result.error) {
        return ApiResponseUtil.badRequest(result.error);
      }

      return ApiResponseUtil.success(result);
    } catch (error) {
      return ApiResponseUtil.internalError(error);
    }
  },
};
