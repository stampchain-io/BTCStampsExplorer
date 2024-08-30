import { CollectionRepository } from "$lib/database/collectionRepository.ts";
import { BlockService } from "$lib/services/blockService.ts";
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
        const stampResult = await StampController.getStamps({
          limit: 100, // Increased limit to get more stamps
          collectionId: row.collection_id,
          noPagination: true,
          type: "all",
          orderBy: "DESC",
        });

        let lowestFloorPrice = Infinity;
        let firstStampImage = null;

        for (const stamp of stampResult.data) {
          if (
            typeof stamp.floorPrice === "number" && !isNaN(stamp.floorPrice)
          ) {
            lowestFloorPrice = Math.min(lowestFloorPrice, stamp.floorPrice);
          }
          if (!firstStampImage && stamp.stamp_url) {
            firstStampImage = stamp.stamp_url;
          }
        }

        return {
          collection_id: row.collection_id,
          collection_name: row.collection_name,
          creators: row.creators ? row.creators.split(",") : [],
          first_stamp_image: firstStampImage,
          floorPrice: lowestFloorPrice !== Infinity ? lowestFloorPrice : null,
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
    orderBy: "asc" | "desc" = "desc",
  ): Promise<Collection | null> {
    const collectionResult = await CollectionRepository.getCollectionByName(
      collectionName,
    );

    if (collectionResult.rows.length === 0) {
      return null;
    }

    const row = collectionResult.rows[0];
    const stamps = await StampController.getStamps({
      limit: limit,
      collectionId: row.collection_id,
      noPagination: true,
      type: "all",
      orderBy: orderBy === "asc" ? "ASC" : "DESC",
    });

    return {
      collection_id: row.collection_id,
      collection_name: row.collection_name,
      creators: row.creators ? row.creators.split(",") : [],
      stamps: stamps?.data?.slice(0, limit) ?? [],
    };
  }
}
