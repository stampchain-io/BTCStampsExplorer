import { connectDb, CursedClass } from "$lib/database/index.ts";
import { BIG_LIMIT } from "utils/constants.ts";

export async function api_get_cursed(
  page = 1,
  page_size: number = BIG_LIMIT,
  order: "DESC" | "ASC" = "DESC",
) {
  try {
    const client = await connectDb();
    const stamps = await CursedClass.get_resumed_cursed_by_page_with_client(
      client,
      page_size,
      page,
      order,
    );
    if (!stamps) {
      await client.close();
      throw new Error("No stamps found");
    }
    const total = await CursedClass.get_total_cursed_with_client(client);
    await client.close();
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
