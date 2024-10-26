import { CollectionService } from "$server/services/collectionService.ts";
import {
  Collection,
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
} from "globals";
import { StampRepository } from "$server/database/stampRepository.ts";

export class CollectionController {
  static async getCollections(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    try {
      return await CollectionService.getCollections(params);
    } catch (error) {
      console.error("Error in CollectionController.getCollections:", error);
      throw error;
    }
  }

  static async getCollectionNames(
    params: CollectionQueryParams,
  ): Promise<PaginatedCollectionResponseBody> {
    try {
      const { limit = 50, page = 1, creator } = params;
      const collectionsResult = await CollectionService.getCollections({
        limit,
        page,
        creator,
      });

      console.log(
        "Collections result:",
        JSON.stringify(collectionsResult, null, 2),
      );

      // Adjust the check to verify that data is an array
      if (!collectionsResult.data || !Array.isArray(collectionsResult.data)) {
        console.error(
          "collectionsResult.data is not in the expected format:",
          collectionsResult.data,
        );
        throw new Error(
          "Unexpected data structure from CollectionService.getCollections",
        );
      }

      // Use collectionsResult.data directly, since it's now an array
      const collectionIds = collectionsResult.data.map(
        (collection: Collection) => collection.collection_id,
      );

      console.log("Collection IDs:", collectionIds);

      // Fetch first stamp for all collections in a single query
      const stampResults = await StampRepository.getStampsFromDb({
        collectionId: collectionIds,
        noPagination: true,
        type: "all",
        sortBy: "ASC",
        allColumns: false,
        groupBy: "collection_id", // Ensure this matches the column name
        groupBySubquery: true,
      });

      console.log("Stamp results:", JSON.stringify(stampResults, null, 2));

      // Make sure stampResults.stamps exists and is an array
      if (!stampResults.stamps || !Array.isArray(stampResults.stamps)) {
        console.error(
          "stampResults.stamps is not in the expected format:",
          stampResults.stamps,
        );
        throw new Error(
          "Unexpected data structure from StampRepository.getStampsFromDb",
        );
      }

      // Create a map of collection_id to first stamp image
      const firstStampImageMap = new Map(
        stampResults.stamps.map(
          (stamp: { collection_id: string; stamp_url: string }) => [
            stamp.collection_id.toLowerCase(),
            stamp.stamp_url,
          ],
        ),
      );

      console.log(
        "First stamp image map:",
        JSON.stringify(Array.from(firstStampImageMap.entries()), null, 2),
      );

      const collections: Collection[] = collectionsResult.data.map(
        (collection: Collection) => ({
          ...collection,
          first_stamp_image:
            firstStampImageMap.get(collection.collection_id.toLowerCase()) ||
            null,
        }),
      );

      console.log("Final collections:", JSON.stringify(collections, null, 2));

      return {
        ...collectionsResult,
        data: collections,
      };
    } catch (error) {
      console.error("Error in CollectionController.getCollectionNames:", error);
      throw error;
    }
  }
}
