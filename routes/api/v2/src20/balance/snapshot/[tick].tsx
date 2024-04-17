import { convertEmojiToTick } from "utils/util.ts";
import {
  AddressTickHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  Src20SnapshotResponseBody,
} from "globals";
import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { Client } from "$mysql/mod.ts";
import { BIG_LIMIT } from "constants";

// @swagger
// /api/v2/src20/balance/snapshot/{tick}:
// get:
//   summary: |
//     Get src20 balance snapshot by tick, based upon current block height.
//   parameters:
//     - in: path
//       name: tick
//       required: true
//       schema:
//         type: string
//       description: The SRC20 tick value
//     - in: query
//       name: limit
//       schema:
//         type: integer
//         minimum: 1
//         default: 200
//       description: The maximum number of transactions to retrieve per page
//     - in: query
//       name: page
//       schema:
//         type: integer
//         minimum: 1
//         default: 1
//       description: The page number of transactions to retrieve
//   responses:
//     '200':
//       description: Successful response
//       content:
//         application/json:
//           schema:
//             $ref: '#/components/schemas/Src20SnapshotResponseBody'
//     '500':
//       description: Internal server error
//       content:
//         application/json:
//           schema:
//             $ref: '#/components/schemas/ErrorResponseBody'

export const handler = async (
  req: PaginatedRequest,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  let { tick } = ctx.params;
  const url = new URL(req.url);
  const params = url.searchParams;
  const limit = Number(params.get("limit")) || BIG_LIMIT;
  const page = Number(params.get("page")) || 1;
  try {
    const client = await getClient();
    if (!client) {
      throw new Error("Client not found");
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    tick = convertEmojiToTick(tick);
    const src20 = await Src20Class.get_src20_holders_by_tick_with_client(
      client as Client,
      tick,
      amt,
      limit,
      page,
    );
    const total_data = await Src20Class
      .get_total_src20_holders_by_tick_with_client(
        client as Client,
        tick,
        amt,
      );
    const total = total_data.rows[0]["total"];
    const body: Src20SnapshotResponseBody = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      total: total,
      snapshot_block: last_block.rows[0]["last_block"],
      data: src20.rows.map((row) => {
        return {
          tick: row["tick"],
          address: row["address"],
          balance: new BigFloat(row["amt"]).toString(),
        };
      }).sort((a, b) => {
        return new BigFloat(b.balance).gte(new BigFloat(a.balance));
      }),
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    console.error(error);
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
