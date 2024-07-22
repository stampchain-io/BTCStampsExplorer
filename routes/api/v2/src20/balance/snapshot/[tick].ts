import { convertEmojiToTick } from "utils/util.ts";
import {
  AddressTickHandlerContext,
  PaginatedRequest,
  Src20SnapshotResponseBody,
} from "globals";
import { getClient, Src20Class } from "$lib/database/index.ts";
import { Client } from "$mysql/mod.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import Big from "https://esm.sh/big.js";
import { Src20SnapShotDetail } from "globals";
import { BlockService } from "$lib/services/blockService.ts";

export const handler = async (
  req: PaginatedRequest,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  let { tick } = ctx.params;
  const url = new URL(req.url);
  const params = url.searchParams;
  const limit = Number(params.get("limit")) || 1000;
  const page = Number(params.get("page")) || 1;
  const amt = Number(params.get("amt"));
  const sort = params.get("sort") || "ASC";
  try {
    const client = await getClient();
    if (!client) {
      throw new Error("Client not found");
    }
    const lastBlock = await BlockService.getLastBlock();
    tick = convertEmojiToTick(String(tick));
    const src20 = await Src20Class.get_src20_balance_with_client(
      client as Client,
      null,
      tick,
      amt,
      limit,
      page,
      sort,
    );

    const total = src20.length;
    const body: Src20SnapshotResponseBody = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      total: total,
      snapshot_block: lastBlock.last_block,
      data: src20.map((row: Src20SnapShotDetail) => {
        return {
          tick: row["tick"],
          address: row["address"],
          balance: new Big(row["amt"]),
        };
      }).sort((a: { balance: Big }, b: { balance: Big }) => {
        const balanceA = new Big(a.balance);
        const balanceB = new Big(b.balance);
        if (balanceB.gte(balanceA)) return 1;
        if (balanceA.gte(balanceB)) return -1;
        return 0;
      }),
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    return ResponseUtil.error("Error: Internal server error");
  }
};
