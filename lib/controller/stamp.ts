import {
  closeClient,
  getClient,
  releaseClient,
  StampsClass,
} from "../database/index.ts";
import {
  get_dispensers,
  get_dispenses,
  get_holders,
  get_sends,
} from "utils/xcp.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { HolderRow, StampRow } from "globals";

const sortData = (
  stamps: StampRow[],
  sortBy: string,
  order: "ASC" | "DESC",
) => {
  let sortedStamps;
  if (sortBy == "Supply") {
    sortedStamps = stamps.sort((a, b) => a.supply - b.supply);
  } else if (sortBy == "Block") {
    sortedStamps = stamps.sort((a, b) => a.block_index - b.block_index);
  } else if (sortBy == "Stamp") {
    sortedStamps = stamps.sort((a, b) => a.stamp - b.stamp);
  } else {
    sortedStamps = stamps.sort((a, b) => a.stamp - b.stamp);
  }

  if (order === "DESC") {
    sortedStamps.reverse();
  }

  return sortedStamps;
};

const filterData = (stamps: StampRow[], filterBy) => {
  if (filterBy.length == 0) {
    return stamps;
  }
  return stamps.filter((stamp) =>
    filterBy.find((option) =>
      stamp.stamp_mimetype.indexOf(option.toLowerCase()) >= 0
    ) != null
  );
};

export async function api_get_stamps(
  page = 1,
  page_size = BIG_LIMIT,
  orderBy: "DESC" | "ASC" = "DESC",
  sortBy = "none",
  filterBy: string[] = [],
  typeBy = ["STAMP", "SRC-721"],
) {
  try {
    const client = await getClient();
    // filterBy = filterBy.map((filter) => {
    //   if (filter === "Gif") {
    //     return "image/gif";
    //   } else if (filter === "Png") {
    //     return "image/png";
    //   } else if (filter === "Svg") {
    //     return "image/svg+xml";
    //   } else if (filter === "Html") {
    //     return "text/html";
    //   } else {
    //     return "";
    //   }
    // });
    // const stamps = await StampsClass.get_resumed_stamps_by_page_with_client(
    //   client,
    //   page_size,
    //   page,
    //   orderBy,
    //   filterBy,
    //   typeBy,
    //   "stamps",
    // );
    const stamps = await StampsClass.get_resumed_stamps(
      client,
      orderBy,
      typeBy,
      "stamps",
    );
    if (!stamps) {
      closeClient(client);
      throw new Error("No stamps found");
    }
    const total = await StampsClass.get_total_stamp_count(
      client,
      "stamps",
      typeBy,
    );

    // Sort the entire dataset before pagination
    const sortedData = sortData(
      filterData(stamps.rows, filterBy),
      sortBy,
      orderBy,
    );

    // Apply pagination
    const paginatedData = sortedData.slice(
      page * page_size - page_size,
      page * page_size,
    );

    releaseClient(client);
    return {
      stamps: paginatedData,
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

export async function api_get_stamp(id: string) {
  try {
    const client = await getClient();
    const stamp = await StampsClass.get_stamp_with_client(client, id);
    if (!stamp) {
      throw new Error(`Error: Stamp ${id} not found`);
    }
    const total = await StampsClass.get_total_stamp_count(
      client,
      "stamps",
    );

    releaseClient(client);

    return {
      stamp: stamp,
      total: total.rows[0].total,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function api_get_stamp_all_data(id: string) {
  try {
    const client = await getClient();
    const stampResult = await StampsClass.get_stamps(client, {
      identifier: id,
      all_columns: true,
      no_pagination: true,
      cache_duration: "never",
    });

    if (!stampResult || stampResult.rows.length === 0) {
      throw new Error(`Error: Stamp ${id} not found`);
    }

    const stamp = stampResult.rows[0];
    const cpid = stamp.cpid;

    const [holders, dispensers, sends, dispenses, total] = await Promise.all([
      get_holders(cpid),
      get_dispensers(cpid),
      get_sends(cpid),
      get_dispenses(cpid),
      StampsClass.get_total_stamp_count(client, "stamps"),
    ]);

    releaseClient(client);
    return {
      stamp: stamp,
      holders: holders.map((holder: HolderRow) => ({
        address: holder.address,
        quantity: holder.divisible
          ? holder.quantity / 100000000
          : holder.quantity,
      })),
      sends: sends,
      dispensers: dispensers,
      dispenses: dispenses,
      total: total.rows[0].total,
    };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function api_get_multiple_stamp_categories(
  categories: { types: string[]; limit: number }[],
) {
  const client = await getClient();
  try {
    const results = await Promise.all(
      categories.map((category) =>
        StampsClass.get_resumed_stamps_by_page_with_client(
          client,
          category.limit,
          1,
          "DESC",
          [],
          category.types,
          "stamps",
        )
      ),
    );

    return results.map((result) => result.rows);
  } finally {
    releaseClient(client);
  }
}
