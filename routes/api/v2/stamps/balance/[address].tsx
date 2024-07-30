import { StampRepository } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import {
  AddressHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedStampBalanceResponseBody,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { BlockService } from "$lib/services/blockService.ts";

export const handler = async (
  _req: PaginatedRequest,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const url = new URL(_req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;

    const [data, totalResult, lastBlock] = await Promise.all([
      StampRepository.getStampBalancesByAddressFromDb(
        address,
        limit,
        page,
      ),
      StampRepository.getCountStampBalancesByAddressFromDb(address),
      BlockService.getLastBlock(),
    ]);

    const total = totalResult.rows[0]?.total || 0;
    const pagination = paginate(total, page, limit);

    const body: PaginatedStampBalanceResponseBody = {
      ...pagination,
      last_block: lastBlock.last_block,
      data: data,
    };
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in stamp balance handler:", error);
    const body: ErrorResponseBody = { error: "Internal server error" };
    return ResponseUtil.error(body.error, 500);
  }
};
