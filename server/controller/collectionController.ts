import { Collection } from "$globals";
import { getStampImageSrc } from "$lib/utils/imageUtils.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { StampService } from "$server/services/stampService.ts";
import { CollectionQueryParams, PaginatedCollectionResponseBody } from "$server/types/collection.d.ts";

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

  static async getCollectionStamps(options: {
    limit?: number;
    page?: number;
    sortBy?: "ASC" | "DESC";
    includeMarketData?: boolean;
  }) {
    try {
      const {
        limit = 50,
        page = 1,
        sortBy = "DESC",
        includeMarketData = true,
      } = options;

      // Get collections with market data
      const collectionsResult = await CollectionService.getCollectionDetails({
        limit,
        page,
        sortBy,
        includeMarketData,
      });

      if (!collectionsResult.data || collectionsResult.data.length === 0) {
        return {
          ...collectionsResult,
          data: [],
        };
      }

      // Get stamps for each collection to build image arrays
      const stampsByCollection = new Map<string, string[]>();

      for (const collection of collectionsResult.data) {
        const collectionId = collection.collection_id;

        // Get stamps for this collection with a reasonable limit for images
        const stampResults = await StampService.getStamps({
          collectionId,
          limit: 12, // Limit stamps per collection for image gallery
          sortBy: "DESC",
          type: "stamps",
          includeSecondary: false,
          skipTotalCount: true,
        });

        if (stampResults.stamps && Array.isArray(stampResults.stamps) && stampResults.stamps.length > 0) {
          const stamps: string[] = [];

          for (const stamp of stampResults.stamps) {
            if (!stamp.tx_hash || !stamp.stamp_mimetype) {
              continue;
            }

            // WORKAROUND: Manually set collection_id since database JOIN is not working
            // This ensures the grouping logic below works correctly
            stamp.collection_id = collectionId;

            const imageUrl = await getStampImageSrc(stamp);
            if (stamps.length < 12 && !stamps.includes(imageUrl)) {
              stamps.push(imageUrl);
            }
          }

          if (stamps.length > 0) {
            stampsByCollection.set(collectionId.toUpperCase(), stamps);
          }
        } else if (stampResults.stamps && !Array.isArray(stampResults.stamps)) {
          // Handle invalid data structure
          throw new Error("Invalid stamp data structure: stamps is not an array");
        }
      }

      // Map collections with their stamps
      const collections: Collection[] = collectionsResult.data.map(
        (collection: Collection) => {
          const collectionId = collection.collection_id.toUpperCase();
          const stamps = stampsByCollection.get(collectionId) || [];

          // Use the second stamp if available, otherwise fall back to the first stamp
          const firstStampImage = stamps[1] || stamps[0] || null;

          return {
            ...collection,
            first_stamp_image: firstStampImage,
            stamp_images: stamps,
          };
        }
      );

      return {
        ...collectionsResult,
        data: collections as any,
        // No need to update total - it's already correct from database filtering
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
