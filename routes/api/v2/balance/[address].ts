import { api_get_balance } from "$lib/controller/wallet.ts";
import { BlockService } from "$lib/services/blockService.ts";
import {
  AddressHandlerContext,
  PaginatedBalanceResponseBody,
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
    const lastBlock = await BlockService.getLastBlock();
    const balanceData = await api_get_balance(address, limit, page);
    const body: PaginatedBalanceResponseBody = {
      ...balanceData,
      last_block: lastBlock.last_block,
      btc: balanceData.btc || {
        address: "",
        balance: 0,
        txCount: 0,
        unconfirmedBalance: 0,
        unconfirmedTxCount: 0,
      },
      data: [...balanceData.data.stamps, ...balanceData.data.src20],
    };

    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error("Internal server error", 500);
  }
};
