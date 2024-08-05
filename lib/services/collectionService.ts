import { CollectionRepository } from "$lib/database/collectionRepository.ts";
import { BlockService } from "$lib/services/blockService.ts";
import {
  Collection,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
} from "globals";
import { paginate } from "utils/util.ts";
import { StampRepository } from "$lib/database/stampRepository.ts";

export class CollectionService {
  static async getCollections(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator } = params;

    const [collectionsResult, totalCollections, lastBlock] = await Promise.all([
      CollectionRepository.getCollections({ limit, page, creator }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator),
      BlockService.getLastBlock(),
    ]);

    const collections: Collection[] = await Promise.all(
      collectionsResult.rows.map(async (row: any) => {
        const stamps = await StampRepository.getStampsFromDb({
          limit: 10,
          collectionId: row.collection_id,
          noPagination: true,
          type: "all",
        });

        return {
          collection_id: row.collection_id,
          collection_name: row.collection_name,
          creators: row.creators ? row.creators.split(",") : [], // FIXME: this is returning [] incorrectly
          stamps: stamps.rows,
        };
      }),
    );

    const pagination = paginate(totalCollections, page, limit);

    return {
      ...pagination,
      last_block: lastBlock.last_block,
      data: collections,
    };
  }

  static async getCollectionByName(
    collectionName: string,
    limit: number = 10,
  ): Promise<Collection | null> {
    const collectionResult = await CollectionRepository.getCollectionByName(
      collectionName,
    );

    if (collectionResult.rows.length === 0) {
      return null;
    }

    const row = collectionResult.rows[0];
    const stamps = await StampRepository.getStampsFromDb({
      limit: limit,
      collectionId: row.collection_id,
      noPagination: true,
      type: "all",
    });

    return {
      collection_id: row.collection_id,
      collection_name: row.collection_name,
      creators: row.creators ? row.creators.split(",") : [],
      stamps: stamps.rows.slice(0, limit), // Ensure we only return up to the limit
    };
  }
}
