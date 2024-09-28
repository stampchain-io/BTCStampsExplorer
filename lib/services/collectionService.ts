import { CollectionRepository } from "$lib/database/collectionRepository.ts";
import { BlockController } from "$lib/controller/blockController.ts";
import {
  Collection,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
} from "globals";
import { paginate } from "utils/util.ts";
import { StampRepository } from "$lib/database/stampRepository.ts";
import { StampController } from "$lib/controller/stampController.ts";

export class CollectionService {
  static async getCollections(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator } = params;

    const [collectionsResult, totalCollections, lastBlock] = await Promise.all([
      CollectionRepository.getCollections({ limit, page, creator }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator),
      BlockController.getLastBlock(),
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
      last_block: lastBlock,
      data: collections,
    };
  }

  static async getCollectionNames(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    const { limit = 50, page = 1, creator } = params;

    const [collectionsResult, totalCollections] = await Promise.all([
      CollectionRepository.getCollections({ limit, page, creator }),
      CollectionRepository.getTotalCollectionsByCreatorFromDb(creator),
    ]);

    const collections: Collection[] = await Promise.all(
      collectionsResult.rows.map(async (row: any) => {
        const stampResult = await StampController.getStamps({ // FIZME: this doesn't appear to be fetching the stamp impage properly
          limit: 1,
          collectionId: row.collection_id,
          // noPagination: true,
          type: "all",
          sortBy: "ASC",
        });

        // let lowestFloorPrice = Infinity;
        let firstStampImage = null;

        for (const stamp of stampResult.data) {
          if (!firstStampImage && stamp.stamp_url) {
            firstStampImage = stamp.stamp_url;
          }
        }

        return {
          collection_id: row.collection_id,
          collection_name: row.collection_name,
          creators: row.creators ? row.creators.split(",") : [],
          first_stamp_image: firstStampImage,
        };
      }),
    );

    const pagination = paginate(totalCollections, page, limit);

    return {
      ...pagination,
      data: collections,
    };
  }

  static async getCollectionByName(
    collectionName: string,
    limit: number = 10,
    sortBy: "ASC" | "DESC" = "DESC",
  ): Promise<Collection | null> {
    const collectionResult = await CollectionRepository.getCollectionByName(
      collectionName,
    );

    if (collectionResult.rows.length === 0) {
      return null;
    }

    const row = collectionResult.rows[0];
    const stamps = await StampController.getStamps({
      page: 1,
      limit: limit,
      collectionId: row.collection_id,
      noPagination: true,
      type: "all",
      sortBy: sortBy === "ASC" ? "ASC" : "DESC",
      // Include suffixFilters if necessary
      // suffixFilters: [],
    });

    return {
      collection_id: row.collection_id,
      collection_name: row.collection_name,
      creators: row.creators ? row.creators.split(",") : [],
      stamps: stamps?.data?.slice(0, limit) ?? [],
    };
  }
}
