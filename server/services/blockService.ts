import { BlockRepository, StampRepository } from "$server/database/index.ts";
import { BlockInfoResponseBody, StampBlockResponseBody } from "globals";

export class BlockService {
  static async getLastXBlocks(num: number) {
    return await BlockRepository.getLastXBlocksFromDb(num);
  }

  static async getBlockInfoWithStamps(
    blockIdentifier: number | string,
    type: "stamps" | "cursed" | "all" = "all",
  ): Promise<StampBlockResponseBody> {
    const [block_info, last_block, data] = await Promise.all([
      BlockRepository.getBlockInfoFromDb(blockIdentifier),
      this.getLastBlock(),
      StampRepository.getStamps({
        type,
        blockIdentifier,
        sortBy: "ASC",
        noPagination: true,
        cacheDuration: "never",
      }),
    ]);

    if (!block_info || !block_info.rows || block_info.rows.length === 0) {
      throw new Error(`Block: ${blockIdentifier} not found`);
    }

    const blockData = {
      ...block_info.rows[0],
      tx_count: data.stamps.length,
    };

    return {
      last_block,
      block_info: blockData,
      data: data.stamps,
    };
  }

  static transformToBlockInfoResponse(
    stampBlockResponse: StampBlockResponseBody,
  ): BlockInfoResponseBody {
    return {
      last_block: stampBlockResponse.last_block,
      block_info: stampBlockResponse.block_info,
      issuances: stampBlockResponse.data,
      sends: [], // Assuming sends is always an empty array as per the original function
    };
  }

  static async getRelatedBlocksWithStamps(blockIdentifier: number | string) {
    const [blocks, last_block] = await Promise.all([
      BlockRepository.getRelatedBlocksWithStampsFromDb(blockIdentifier),
      this.getLastBlock(),
    ]);

    return {
      last_block,
      blocks,
    };
  }

  static async getLastBlock(): Promise<number> {
    const last_block = await BlockRepository.getLastBlockFromDb();
    if (!last_block || !last_block.rows || last_block.rows.length === 0) {
      throw new Error("Could not get last block");
    }

    return last_block.rows[0].last_block;
  }
}
