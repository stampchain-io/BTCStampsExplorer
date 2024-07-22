import { BIG_LIMIT } from "utils/constants.ts";
import { getClient, Src20Class } from "$lib/database/index.ts";

export class Src20Service {
  static async getSrc20s(page = 1, page_size = BIG_LIMIT) {
    const client = await getClient();
    const data = await Src20Class.get_valid_src20_tx_with_client(
      client,
      null,
      null,
      "DEPLOY",
      page_size,
      page,
    );
    const total = await Src20Class.get_total_valid_src20_tx_with_client(
      client,
      null,
      "DEPLOY",
    );

    return {
      src20s: data.rows,
      total: total.rows[0].total,
      pages: Math.ceil(total.rows[0].total / page_size),
      page: page,
      page_size: page_size,
    };
  }
}
