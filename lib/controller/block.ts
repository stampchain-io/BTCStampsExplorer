import {
  getBlockInfo,
  getLastBlock,
  getRelatedBlocks,
  transformToBlockInfoResponse,
} from "$lib/services/blockService.ts";

export async function api_get_block(blockIdentifier: number | string) {
  try {
    const stampBlockResponse = await getBlockInfo(blockIdentifier, "stamps");
    return transformToBlockInfoResponse(stampBlockResponse);
  } catch (error) {
    console.error("Error in api_get_block:", error);
    throw error;
  }
}

export const api_get_related_blocks = getRelatedBlocks;

export const api_get_last_block = getLastBlock;
