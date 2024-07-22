import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { CollectionRepository } from "$lib/database/collectionRepository.ts";
import { BlockService } from "$lib/services/blockService.ts";
import {
  Collection,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
} from "globals";
import { paginate } from "$lib/utils/util.ts";

export class CollectionService {
  static async getCollections(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    return await withDatabaseClient(async (client) => {
      const { limit = 50, page = 1, creator } = params;

      const [collectionsResult, totalCollections, lastBlock] = await Promise
        .all([
          CollectionRepository.getCollections(client, { limit, page, creator }),
          CollectionRepository.getTotalCollections(client, creator),
          BlockService.getLastBlock(),
        ]);

      const collections: Collection[] = await Promise.all(
        collectionsResult.rows.map(async (row: any) => {
          const stamps = await CollectionRepository.getCollectionStamps(
            client,
            row.collection_id,
            10, // Limit to 10 stamps per collection
            0,
          );

          return {
            collection_id: row.collection_id,
            collection_name: row.collection_name,
            creators: row.creators.split(","),
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
    });
  }
}
