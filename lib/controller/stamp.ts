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

const sortData = (stamps, sortBy) => {
  if (sortBy == "Supply") {
    return [...stamps.sort((a, b) => a.supply - b.supply)];
  } else if (sortBy == "Block") {
    return [...stamps.sort((a, b) => a.block_index - b.block_index)];
  } else if (sortBy == "Stamp") {
    return [...stamps.sort((a, b) => a.stamp - b.stamp)];
  }
  return [...stamps];
};

const filterData = (stamps, filterBy) => {
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
  order: "DESC" | "ASC" = "ASC",
  sortBy = "none",
  filterBy = [],
) {
  try {
    const client = await getClient();
    const stamps = await StampsClass.get_resumed_stamps(
      client,
      order,
    );
    if (!stamps) {
      closeClient(client);
      throw new Error("No stamps found");
    }
    const total = await StampsClass.get_total_stamps_by_ident_with_client(
      client,
      ["STAMP", "SRC-721"],
    );

    let data = sortData(filterData(stamps.rows, filterBy), sortBy).slice(
      page * page_size - page_size,
      page * page_size,
    );
    releaseClient(client);
    return {
      stamps: data,
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
    const total = await StampsClass.get_total_stamps_with_client(client);
    const cpid_result = await StampsClass.get_cpid_from_identifier_with_client(
      client,
      id,
    );
    const cpid = cpid_result.rows[0].cpid;
    releaseClient(client);
    // const holders = await get_holders(cpid);
    // const dispensers = await get_dispensers(cpid);
    // const sends = await get_sends(cpid);
    // const dispenses = await get_dispenses(cpid);
    return {
      stamp: stamp,
      // holders: holders.map((holder: any) => {
      //   return {
      //     address: holder.address,
      //     quantity: holder.divisible
      //       ? holder.quantity / 100000000
      //       : holder.quantity,
      //   };
      // }),
      // sends: sends,
      // dispensers: dispensers,
      // dispenses: dispenses,
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
    const stamp = await StampsClass.get_stamp_with_client(client, id);
    if (!stamp) {
      throw new Error(`Error: Stamp ${id} not found`);
    }
    const total = await StampsClass.get_total_stamps_with_client(client);
    const cpid_result = await StampsClass.get_cpid_from_identifier_with_client(
      client,
      id,
    );
    const cpid = cpid_result.rows[0].cpid;

    const holders = await get_holders(cpid);
    const dispensers = await get_dispensers(cpid);
    const sends = await get_sends(cpid);
    const dispenses = await get_dispenses(cpid);
    releaseClient(client);
    return {
      stamp: stamp,
      holders: holders.map((holder: any) => {
        return {
          address: holder.address,
          quantity: holder.divisible
            ? holder.quantity / 100000000
            : holder.quantity,
        };
      }),
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
