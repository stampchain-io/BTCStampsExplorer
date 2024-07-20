import {
  CommonClass,
  getClient,
  releaseClient,
  StampsClass,
} from "$lib/database/index.ts";
import { BlockInfoResponseBody, StampBlockResponseBody } from "globals";

export async function getBlockInfo(
  blockIdentifier: number | string,
  type: "stamps" | "cursed" | "all" = "stamps",
): Promise<StampBlockResponseBody> {
  const client = await getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }

  try {
    const [block_info, last_block, data] = await Promise.all([
      CommonClass.get_block_info_with_client(client, blockIdentifier),
      CommonClass.get_last_block_with_client(client),
      StampsClass.get_stamps(client, {
        type,
        blockIdentifier,
        sort_order: "asc",
        no_pagination: true,
        cache_duration: "never",
      }),
    ]);

    if (!block_info || !block_info.rows || block_info.rows.length === 0) {
      throw new Error(`Block: ${blockIdentifier} not found`);
    }

    if (!last_block || !last_block.rows || last_block.rows.length === 0) {
      throw new Error("Could not get last block");
    }

    return {
      last_block: last_block.rows[0].last_block,
      block_info: block_info.rows[0],
      data: data.rows,
    };
  } finally {
    releaseClient(client);
  }
}

export function transformToBlockInfoResponse(
  stampBlockResponse: StampBlockResponseBody,
): BlockInfoResponseBody {
  return {
    last_block: stampBlockResponse.last_block,
    block_info: stampBlockResponse.block_info,
    issuances: stampBlockResponse.data,
    sends: [], // Assuming sends is always an empty array as per the original function
  };
}

export async function getRelatedBlocks(blockIdentifier: number | string) {
  const client = await getClient();
  if (!client) {
    throw new Error("Could not connect to database");
  }

  try {
    const [blocks, last_block] = await Promise.all([
      CommonClass.get_related_blocks_with_client(client, blockIdentifier),
      CommonClass.get_last_block_with_client(client),
    ]);

    if (!last_block || !last_block.rows || last_block.rows.length === 0) {
      throw new Error("Could not get last block");
    }

    return {
      last_block: last_block.rows[0].last_block,
      blocks,
    };
  } finally {
    releaseClient(client);
  }
}

export async function getLastBlock() {
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
  } finally {
    releaseClient(client);
  }
}
