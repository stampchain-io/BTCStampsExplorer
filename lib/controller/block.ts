import { CommonClass, getClient, releaseClient } from "$lib/database/index.ts";
import { categorizeInput } from "$lib/utils/util.ts";

export async function api_get_block(block_index_or_hash: number | string) {
  try {
    const client = await getClient();
    if (!client) {
      throw new Error("Could not connect to database");
    }
    let block_info;
    const cat = categorizeInput(block_index_or_hash);
    if (cat === "number") {
      block_info = await CommonClass.get_block_info_with_client(
        client,
        block_index_or_hash,
      );
    } else if (cat === "hex_string") {
      block_info = await CommonClass.get_block_info_by_hash_with_client(
        client,
        block_index_or_hash,
      );
    }
    if (!block_info || !block_info?.rows?.length) {
      throw new Error(`Block: ${block_index_or_hash} not found`);
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    if (!last_block || !last_block?.rows?.length) {
      throw new Error("Could not get last block");
    }
    const issuances = await CommonClass
      .get_issuances_by_block_index_with_client(
        client,
        block_index_or_hash,
      );

    const sends = [];
    const response = {
      last_block: last_block.rows[0]["last_block"],
      block_info: block_info.rows[0],
      issuances: issuances.rows,
      sends: sends,
    };
    releaseClient;
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export const api_get_related_blocks = async (
  block_index_or_hash: number | string,
) => {
  try {
    const client = await getClient();
    if (!client) {
      throw new Error("Could not connect to database");
    }
    let blocks;
    const cat = categorizeInput(block_index_or_hash);
    if (cat === "number") {
      blocks = await CommonClass.get_related_blocks_with_client(
        client,
        block_index_or_hash,
      );
    } else if (cat === "hex_string") {
      blocks = await CommonClass.get_related_blocks_by_hash_with_client(
        client,
        block_index_or_hash,
      );
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    if (!last_block || !last_block?.rows?.length) {
      throw new Error("Could not get last block");
    }
    const response = {
      last_block: last_block.rows[0]["last_block"],
      blocks,
    };
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const api_get_last_block = async () => {
  try {
    const client = await getClient();
    if (!client) {
      throw new Error("Could not connect to database");
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    if (!last_block || !last_block?.rows?.length) {
      throw new Error("Could not get last block");
    }
    const response = {
      last_block: last_block.rows[0]["last_block"],
    };
    return response;
  } catch (error) {
    console.error(error);
    throw error;
  }
};
