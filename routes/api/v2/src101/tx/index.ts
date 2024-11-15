import { Handlers } from "$fresh/server.ts";
import { Src101Controller } from "$server/controller/src101Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";


export interface SRC101TxParams {
  tick?: string;
  op?: string;
  valid?: number;
  block_index?: string;
  deploy_hash?: string;
  limit?: number;
  page?: number;
}


export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const block_index = url.searchParams.get("block_index");
      const deploy_hash = url.searchParams.get("deploy_hash");
      const valid = Number(url.searchParams.get("valid"));
      const op = url.searchParams.get("op");

      const queryParams = {
        block_index: block_index,
        deploy_hash: deploy_hash,
        valid: valid,
        op: op,
        limit: limit || 1000,
        page: page || 1,
      };

      const result = await Src101Controller.handleSrc101TXFromSRC101Table(
        queryParams
      );

      if (!result || Object.keys(result).length === 0) {
        console.log("Empty result received:", result);
        return ResponseUtil.error("No data found", 404);
      }

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in index handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing src101 valid tx request",
      );
    }
  }
}