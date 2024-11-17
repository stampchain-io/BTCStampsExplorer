import { BlockService } from "$server/services/blockService.ts";
import { BlockInfoResponseBody, StampBlockResponseBody } from "globals";
import { isIntOr32ByteHex } from "$lib/utils/formatUtils.ts";

export class BlockController {
  static async getLastXBlocks(num: number) {
    return await BlockService.getLastXBlocks(num);
  }

  static async getBlockInfoWithStamps(
    blockIdentifier: number | string,
    type: "stamps" | "cursed" | "all" = "all",
  ): Promise<StampBlockResponseBody> {
    return await BlockService.getBlockInfoWithStamps(blockIdentifier, type);
  }

  static transformToBlockInfoResponse(
    stampBlockResponse: StampBlockResponseBody,
  ): BlockInfoResponseBody {
    return BlockService.transformToBlockInfoResponse(stampBlockResponse);
  }

  static async getRelatedBlocksWithStamps(blockIdentifier: number | string) {
    return await BlockService.getRelatedBlocksWithStamps(blockIdentifier);
  }

  static async getLastBlock(): Promise<number> {
    return await BlockService.getLastBlock();
  }

  static async getBlockPageData(blockIdentifier: number | string) {
    if (!blockIdentifier || isNaN(Number(blockIdentifier))) {
      const lastBlock = await this.getLastBlock();
      blockIdentifier = lastBlock;
    }

    const [stampBlockResponse, related_blocks] = await Promise.all([
      this.getBlockInfoWithStamps(blockIdentifier, "stamps"),
      this.getRelatedBlocksWithStamps(blockIdentifier),
    ]);

    const block = this.transformToBlockInfoResponse(stampBlockResponse);

    return {
      block,
      related_blocks,
    };
  }

  static async getBlockInfoResponse(
    blockIdentifier: number | string,
    type: "stamps" | "cursed" | "all" = "all",
  ) {
    if (!isIntOr32ByteHex(blockIdentifier)) {
      throw new Error(
        `Invalid input: ${blockIdentifier}. It must be a valid block index (integer) or block hash (64 character string).`,
      );
    }

    const blockInfo = await this.getBlockInfoWithStamps(blockIdentifier, type);
    return this.transformToBlockInfoResponse(blockInfo);
  }

  static async getRelatedBlockInfoResponse(
    blockIdentifier: number | string,
    type: "stamps" | "cursed",
  ) {
    if (!isIntOr32ByteHex(blockIdentifier)) {
      throw new Error(
        "Invalid argument provided. Must be an integer or 32 byte hex string.",
      );
    }

    const blockInfo = await this.getBlockInfoWithStamps(blockIdentifier, type);
    return this.transformToBlockInfoResponse(blockInfo);
  }

  static async getSharedBlockWithStamps(
    blockIndex: string | undefined,
    type: "stamps" | "cursed",
  ) {
    let blockIdentifier: number | string;

    if (!blockIndex) {
      const lastBlock = await this.getLastBlock();
      blockIdentifier = lastBlock;
    } else if (!isIntOr32ByteHex(blockIndex)) {
      throw new Error(
        `Invalid input: ${blockIndex}. It must be a valid block index (integer) or block hash (64 character string).`,
      );
    } else {
      blockIdentifier = /^\d+$/.test(blockIndex)
        ? Number(blockIndex)
        : blockIndex;
    }

    return await this.getBlockInfoWithStamps(blockIdentifier, type);
  }
}
