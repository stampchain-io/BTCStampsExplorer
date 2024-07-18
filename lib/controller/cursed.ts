import {
  closeClient,
  getClient,
  releaseClient,
  StampsClass,
} from "$lib/database/index.ts";
import { BIG_LIMIT } from "utils/constants.ts";

export async function api_get_cursed(
  page = 1,
  page_size: number = BIG_LIMIT,
  order: "DESC" | "ASC" = "DESC",
) {
  try {
    const client = await getClient();
    const stamps = await StampsClass.get_resumed_stamps_by_page_with_client(
      client,
      page_size,
      page,
      order,
      "cursed",
    );
    if (!stamps) {
      closeClient(client);
      throw new Error("No stamps found");
    }
    const total = await StampsClass.get_total_stamp_count(
      client,
      "cursed",
    );
    releaseClient(client);
    return {
      stamps: stamps.rows,
      total: total.rows[0].total,
      pages: Math.ceil(total.rows[0].total / page_size),
      page: page,
      page_size: page_size,
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
}
