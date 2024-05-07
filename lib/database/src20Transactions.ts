// utils/src20Transactions.ts
import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import {
  convertToEmoji,
  jsonStringifyBigInt,
  paginate,
} from "$lib/utils/util.ts";
import { SRC20BalanceRequestParams } from "globals";
import {
  PaginatedSrc20ResponseBody,
  Src20BalanceResponseBody,
  SRC20TrxRequestParams,
} from "globals";
import { ErrorResponseBody } from "globals";
import { releaseClient } from "$lib/database/db.ts";

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
  const last_block = await CommonClass.get_last_block_with_client(client);
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
    last_block: last_block.rows[0]["last_block"],
    data:
      (tick !== undefined || tx_hash !== undefined) && mappedData.length === 1
        ? mappedData[0]
        : mappedData,
  };

  releaseClient(client);
  return jsonStringifyBigInt(body);
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
    const responseBodyString = await fetchAndFormatSrc20Transactions(
      finalParams,
    );
    return new Response(responseBodyString, {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error processing request:", error);
    const errorBody: ErrorResponseBody = {
      error: `Error: Internal server error. ${error.message || ""}`,
    };
    return new Response(JSON.stringify(errorBody), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export async function fetchAndFormatSrc20Balance(
  // TODO: pending implementation to reduce code duplication in /balance api calls
  params: SRC20BalanceRequestParams,
) {
  // Destructure and use params
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
    amt,
    limit,
    page,
    sort,
  );

  const total_data = await Src20Class
    .get_total_src20_holders_by_tick_with_client(
      client,
      tick,
      amt,
    );
  const total = total_data.rows[0]["total"];
  const last_block = await CommonClass.get_last_block_with_client(client);

  const body: Src20BalanceResponseBody = {
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    total,
    last_block: last_block.rows[0]["last_block"],
    data: src20.rows.map((row) => ({
      tick: row["tick"],
      address: row["address"],
      balance: row["amt"],
    })),
  };

  return jsonStringifyBigInt(body);
}
