import { CollectionService } from "$lib/services/collectionService.ts";
import {
  CollectionQueryParams,
  PaginatedCollectionResponseBody,
} from "globals";

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
}
