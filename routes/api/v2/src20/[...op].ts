import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const opParam = ctx.params.op;
      const ops = Array.isArray(opParam) ? opParam : [opParam];

      // TODO: add to documentation:
      // This supports multiple operations, separated by a slash.
      // For example, /transfer/mint/deploy  /api/v2/src20/mint/deploy
      const splitOps = ops.flatMap((op) => op.split("/"));

      const validOps = ["transfer", "mint", "deploy"];
      if (!splitOps.every((op) => validOps.includes(op))) {
        return ResponseUtil.error("Invalid operation", 400);
      }

      const result = await Src20Controller.handleSrc20TransactionsRequest(
        req,
        { op: splitOps },
      );

      return result;
    } catch (error) {
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
