import { CollectionService } from "$server/services/collectionService.ts";
import {
  Collection,
} from "$globals";
import { CollectionQueryParams, PaginatedCollectionResponseBody } from "$server/types/collection.d.ts";
import { StampController } from "$server/controller/stampController.ts";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";

export class CollectionController {
  static async getCollectionDetails(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    try {
      return await CollectionService.getCollectionDetails(params);
    } catch (error) {
      console.error("Error in CollectionController.getCollectionDetails:", error);
      throw error;
    }
  }

  static async getCollectionStamps(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    try {
      const { limit = 50, page = 1, creator, sortBy } = params;
      const collectionsResult = await CollectionService.getCollectionDetails({
        limit,
        page,
        creator,
        sortBy
      });

      if (!collectionsResult.data || !Array.isArray(collectionsResult.data)) {
        throw new Error(
          "Unexpected data structure from CollectionService.getCollectionDetails",
        );
      }

      // Filter out collections with less than 2 stamps
      const validCollections = collectionsResult.data.filter(
        (collection: Collection) => collection.stamp_count >= 2
      );

      const collectionIds = validCollections.map(
        (collection: Collection) => collection.collection_id,
      );

      // Calculate total limit based on number of collections
      const totalLimit = collectionIds.length * 12;

      console.log('Fetching stamps for collections:', {
        collectionIds,
        totalLimit,
        collectionStampLimit: 12
      });

      const stampResults = await StampController.getStamps({
        collectionId: collectionIds,
        noPagination: false,
        type: "all",
        sortBy: "ASC",
        allColumns: false,
        limit: totalLimit,
        collectionStampLimit: 12,
        groupBy: "collection_id",
        groupBySubquery: true
      });

      if (!stampResults.data || !Array.isArray(stampResults.data)) {
        throw new Error(
          "Unexpected data structure from StampController.getStamps",
        );
      }

      // Create a map to store stamps by collection ID
      const stampsByCollection = new Map<string, string[]>();

      // Group stamps by collection ID
      stampResults.data.forEach(async (stamp: { 
        collection_id: string; 
        tx_hash: string;
        stamp_mimetype: string;
      }) => {
        if (!stamp.tx_hash || !stamp.stamp_mimetype) {
          return;
        }
        
        const collectionId = stamp.collection_id?.toUpperCase();
        if (!collectionId) {
          return;
        }

        if (!stampsByCollection.has(collectionId)) {
          stampsByCollection.set(collectionId, []);
        }

        const stamps = stampsByCollection.get(collectionId)!;
        const imageUrl = await getStampImageSrc(stamp);
        if (stamps.length < 12 && !stamps.includes(imageUrl)) {
          stamps.push(imageUrl);
        }
      });

      // Map collections with their stamps
      const collections: Collection[] = validCollections.map(
        (collection: Collection) => {
          const collectionId = collection.collection_id.toUpperCase();
          const stamps = stampsByCollection.get(collectionId) || [];
          
          return {
            ...collection,
            first_stamp_image: stamps[1] || null,
            stamp_images: stamps,
          };
        }
      );

      return {
        ...collectionsResult,
        data: collections,
        total: validCollections.length, // Update total count to reflect filtered collections
      };
    } catch (error) {
      console.error("Error in CollectionController.getCollectionStamps:", error);
      throw error;
    }
  }

  static async getCollectionNames(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    try {
      return await CollectionService.getCollectionNames(params);
    } catch (error) {
      console.error("Error in CollectionController.getCollectionNames:", error);
      throw error;
    }
  }
}
