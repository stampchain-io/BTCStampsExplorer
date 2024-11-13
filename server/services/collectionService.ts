import { CollectionRepository } from "$server/database/collectionRepository.ts";
import { BlockController } from "$server/controller/blockController.ts";
import {
  Collection,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
} from "globals";
import { paginate } from "$lib/utils/util.ts";

export class CollectionService {
  static async getCollectionDetails(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator } = params;

    const [collectionsResult, totalCollections, lastBlock] = await Promise.all([
      CollectionRepository.getCollectionDetails({ limit, page, creator }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator),
      BlockController.getLastBlock(),
    ]);

    const collectionsData = collectionsResult.rows;

    // Compute pagination details
    const pagination = paginate(totalCollections, page, limit);

    return {
      ...pagination,
      last_block: lastBlock,
      data: collectionsData,
    };
  }
  static async getTotalCollectionsByCreatorFromDb(
    creator?: string,
  ): Promise<number> {
    return CollectionRepository.getTotalCollectionsByCreatorFromDb(creator);
  }

  static async getCollectionByName(
    collectionName: string,
  ): Promise<Collection | null> {
    return CollectionRepository.getCollectionByName(collectionName);
  }

  static async getCollectionNames(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator } = params;

    const [collectionsResult, totalCollections] = await Promise.all([
      CollectionRepository.getCollectionNames({ limit, page, creator }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator),
    ]);

    const pagination = paginate(totalCollections, page, limit);

    return {
      ...pagination,
      data: collectionsResult,
    };
  }
}
