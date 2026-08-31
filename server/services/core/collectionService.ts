import { paginate } from "$lib/utils/data/pagination/paginationUtils.ts";
import { BlockController } from "$server/controller/blockController.ts";
import { CollectionRepository } from "$server/database/collectionRepository.ts";
import type { CollectionQueryParams, CollectionRow, CollectionWithCreators, PaginatedCollectionResponseBody } from "$server/types/collection.d.ts";

export class CollectionService {
  static async getCollectionDetails(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator, sortBy, minStampCount, includeMarketData = false, editionsFilter } = params;

    const [collectionsResult, totalCollections, lastBlock] = await Promise.all([
      includeMarketData
        ? CollectionRepository.getCollectionDetailsWithMarketData({ limit, page, ...(creator && { creator }), ...(sortBy && { sortBy }), ...(minStampCount && { minStampCount }), includeMarketData, ...(editionsFilter && { editionsFilter }) })
        : CollectionRepository.getCollectionDetails({ limit, page, ...(creator && { creator }), ...(sortBy && { sortBy }), ...(minStampCount && { minStampCount }), ...(editionsFilter && { editionsFilter }) }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator, minStampCount, editionsFilter),
      BlockController.getLastBlock(),
    ]);

    const collectionsData = collectionsResult.rows;

    // Transform creator addresses and names into arrays
    collectionsData.forEach((collection: any) => {
      if (collection.creators && typeof collection.creators === 'string') {
        collection.creators = collection.creators.split(',');
      }
      if (collection.creator_names && typeof collection.creator_names === 'string') {
        collection.creator_names = collection.creator_names.split(',').filter((name: string) => name && name !== 'null');
      }
    });

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
    return await CollectionRepository.getTotalCollectionsByCreatorFromDb(creator);
  }

  static async getCollectionByName(
    collectionName: string,
  ): Promise<CollectionRow | null> {
    return await CollectionRepository.getCollectionByName(collectionName);
  }

  static async getCollectionById(
    collectionId: string,
    options: {
      includeMarketData?: boolean;
      stampLimit?: number;
      stampPage?: number;
    } = {},
  ): Promise<CollectionWithCreators | null> {
    return await CollectionRepository.getCollectionById(collectionId, options);
  }

  static async getCollectionNames(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator } = params;

    const [collectionsResult, totalCollections, lastBlock] = await Promise.all([
      CollectionRepository.getCollectionNames({ limit, page, ...(creator && { creator }) }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator),
      BlockController.getLastBlock(),
    ]);

    const pagination = paginate(totalCollections, page, limit);

    return {
      ...pagination,
      last_block: lastBlock,
      data: collectionsResult as any,
    };
  }
}
