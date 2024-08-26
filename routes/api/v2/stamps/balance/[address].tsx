import { StampController } from "$lib/controller/stampController.ts";
import {
  AddressHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: PaginatedRequest,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const url = new URL(_req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;

    const body = await StampController.getStampBalancesByAddress(
      address,
      limit,
      page,
    );
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in stamp balance handler:", error);
    const body: ErrorResponseBody = { error: "Internal server error" };
    return ResponseUtil.error(body.error, 500);
  }
};
