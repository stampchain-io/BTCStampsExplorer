import { BlockRepository, StampRepository } from "$lib/database/index.ts";
import { BlockInfoResponseBody, StampBlockResponseBody } from "globals";
import { withDatabaseClient } from "$lib/services/databaseService.ts";

export class BlockService {
  static async getBlockInfoWithStamps(
    blockIdentifier: number | string,
    type: "stamps" | "cursed" | "all" = "all",
  ): Promise<StampBlockResponseBody> {
    return await withDatabaseClient(async (client) => {
      const [block_info, last_block, data] = await Promise.all([
        BlockRepository.getBlockInfoFromDb(client, blockIdentifier),
        this.getLastBlock(),
        StampRepository.getStampsFromDb(client, {
          type,
          blockIdentifier,
          sort_order: "asc",
          noPagination: true,
          cacheDuration: "never",
        }),
      ]);

      if (!block_info || !block_info.rows || block_info.rows.length === 0) {
        throw new Error(`Block: ${blockIdentifier} not found`);
      }

      if (!last_block || !last_block.last_block) {
        throw new Error("Could not get last block");
      }

      return {
        last_block: last_block.last_block,
        block_info: block_info.rows[0],
        data: data.rows,
      };
    });
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
    return await withDatabaseClient(async (client) => {
      const [blocks, last_block] = await Promise.all([
        BlockRepository.getRelatedBlocksWithStampsFromDb(
          client,
          blockIdentifier,
        ),
        this.getLastBlock(),
      ]);

      if (
        !last_block || !last_block.last_block
      ) {
        throw new Error("Could not get last block");
      }

      return {
        last_block: last_block.last_block,
        blocks,
      };
    });
  }

  static async getLastBlock() {
    return await withDatabaseClient(async (client) => {
      const last_block = await BlockRepository.getLastBlockFromDb(
        client,
      );
      if (!last_block || !last_block.rows || last_block.rows.length === 0) {
        throw new Error("Could not get last block");
      }

      return {
        last_block: last_block.rows[0].last_block,
      };
    });
  }
}
