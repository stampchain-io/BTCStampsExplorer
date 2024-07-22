import { getClient, Src20Class } from "$lib/database/index.ts";
import { BlockService } from "$lib/services/blockService.ts";
import {
  convertToEmoji,
  jsonStringifyBigInt,
  paginate,
} from "$lib/utils/util.ts";
import { SRC20BalanceRequestParams } from "globals";
import {
  PaginatedSrc20BalanceResponseBody,
  PaginatedSrc20ResponseBody,
  SRC20TrxRequestParams,
} from "globals";
import { releaseClient } from "$lib/database/db.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export async function fetchAndFormatSrc20Transactions(
  params: SRC20TrxRequestParams,
) {
  const {
    block_index = null,
    tick = null,
    op = null,
    limit = 1000,
    page = 1,
    sort = "ASC",
    tx_hash = null,
    address = null,
  } = params;
  const client = await getClient();
  const valid_src20_txs_in_block = await Src20Class
    .get_valid_src20_tx_with_client(
      client,
      block_index ? Number(block_index) : null,
      tick,
      op,
      limit,
      page,
      sort,
      tx_hash,
      address,
    );
  const totalResult = await Src20Class.get_total_valid_src20_tx_with_client(
    client,
    tick,
    op,
    block_index ? Number(block_index) : null,
    tx_hash,
    address,
  );
  const total = totalResult.rows[0]["total"];
  const lastBlock = await BlockService.getLastBlock();
  const pagination = paginate(total, page, limit);
  const mappedData = valid_src20_txs_in_block.rows.map((tx: any) => ({
    ...tx,
    tick: convertToEmoji(tx.tick),
    amt: tx.amt ? tx.amt.toString() : null,
    lim: tx.lim ? tx.lim.toString() : null,
    max: tx.max ? tx.max.toString() : null,
  }));

  const body: PaginatedSrc20ResponseBody = {
    ...pagination,
    last_block: lastBlock.last_block,
    data: tx_hash !== null && mappedData.length === 1 &&
        block_index === null
      ? mappedData[0]
      : [mappedData].flat(),
  };
  releaseClient(client);
  return body;
}

export async function handleSrc20TransactionsRequest(
  req: Request,
  params: Partial<SRC20TrxRequestParams>,
): Promise<Response> {
  const url = new URL(req.url);
  const finalParams: SRC20TrxRequestParams = {
    ...params,
    op: url.searchParams.get("op"),
    limit: Number(url.searchParams.get("limit")) || 1000,
    page: Number(url.searchParams.get("page")) || 1,
    sort: url.searchParams.get("sort") || "ASC",
  };

  try {
    const responseBody = await fetchAndFormatSrc20Transactions(finalParams);
    return ResponseUtil.success(responseBody);
  } catch (error) {
    console.error("Error processing request:", error);
    return ResponseUtil.error(
      `Error: Internal server error. ${error.message || ""}`,
    );
  }
}

export async function fetchAndFormatSrc20Balance(
  params: SRC20BalanceRequestParams,
) {
  const {
    address = null,
    tick = null,
    amt = 0,
    limit = 1000,
    page = 1,
    sort = "ASC",
  } = params;
  const client = await getClient();
  const src20 = await Src20Class.get_src20_balance_with_client(
    client,
    address,
    tick,
    amt ?? 0,
    limit,
    page,
    sort,
  );
  if (!src20.rows.length) {
    releaseClient(client);
    return ResponseUtil.error(`Error: SRC20 balance not found`, 404);
  }
  const total_data = await Src20Class
    .get_total_src20_holders_by_tick_with_client(
      client,
      tick,
      amt ?? 0,
    );
  const total = total_data.rows[0]["total"];
  const lastBlock = await BlockService.getLastBlock();
  const body: PaginatedSrc20BalanceResponseBody = {
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    total,
    last_block: lastBlock.last_block,
    data: src20.rows.map((
      row: { tick: string; address: string; amt: number },
    ) => ({
      tick: row.tick,
      address: row.address,
      balance: row.amt,
    })),
  };

  releaseClient(client);
  return ResponseUtil.success(jsonStringifyBigInt(body)); // Using ResponseUtil for success response
}
