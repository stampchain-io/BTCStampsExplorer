import { BlockRepository } from "$lib/database/blockRepository.ts";

export class BlockController {
  static async getLastXBlocks(num: number) {
    return await BlockRepository.getLastXBlocks(num);
  }
}
