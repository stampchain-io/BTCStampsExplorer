import { CommonClass, getClient, releaseClient } from "$lib/database/index.ts";

export async function api_get_block(block_index_or_hash: number | string) {
  const client = await getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }

  try {
    const [block_info, last_block, issuances] = await Promise.all([
      CommonClass.get_block_info_with_client(client, block_index_or_hash),
      CommonClass.get_last_block_with_client(client),
      CommonClass.get_stamps_by_block_with_client(
        client,
        block_index_or_hash,
        "stamps",
      ),
    ]);

    if (!block_info || !block_info.rows || block_info.rows.length === 0) {
      throw new Error(`Block: ${block_index_or_hash} not found`);
    }

    if (!last_block || !last_block.rows || last_block.rows.length === 0) {
      throw new Error("Could not get last block");
    }

    const response = {
      last_block: last_block.rows[0].last_block,
      block_info: block_info.rows[0],
      issuances: issuances.rows,
      sends: [], // Assuming sends is always an empty array as per the original function
    };

    return response;
  } catch (error) {
    console.error("Error in api_get_block:", error);
    throw error;
  } finally {
    releaseClient(client);
  }
}

export const api_get_related_blocks = async (
  block_index_or_hash: number | string,
) => {
  const client = await getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }

  try {
    const [blocks, last_block] = await Promise.all([
      CommonClass.get_related_blocks_with_client(client, block_index_or_hash),
      CommonClass.get_last_block_with_client(client),
    ]);

    if (!last_block || !last_block.rows || last_block.rows.length === 0) {
      throw new Error("Could not get last block");
    }

    return {
      last_block: last_block.rows[0].last_block,
      blocks,
    };
  } catch (error) {
    console.error("Error in api_get_related_blocks:", error);
    throw error;
  } finally {
    releaseClient(client);
  }
};

export const api_get_last_block = async () => {
  const client = await getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }

  try {
    const last_block = await CommonClass.get_last_block_with_client(client);
    if (!last_block || !last_block.rows || last_block.rows.length === 0) {
      throw new Error("Could not get last block");
    }

    return {
      last_block: last_block.rows[0].last_block,
    };
  } catch (error) {
    console.error("Error in api_get_last_block:", error);
    throw error;
  } finally {
    releaseClient(client);
  }
};
