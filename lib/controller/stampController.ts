import { StampService } from "$lib/services/stampService.ts";
import { filterData, sortData } from "utils/stampUtils.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "globals";
import { Src20Service } from "$lib/services/src20Service.ts";
import { formatSRC20Row } from "utils/src20Utils.ts";
import { CollectionService } from "$lib/services/collectionService.ts";

export class StampController {
  static async getStampDetailsById(id: string) {
    try {
      const res = await StampService.getStampDetailsById(id, "all");
      if (!res) {
        return null;
      }

      const {
        stamp,
        holders,
        sends,
        dispensers,
        dispenses,
        total,
        last_block,
      } = res;

      const processedHolders = holders.map((holder: HolderRow) => ({
        address: holder.address,
        quantity: holder.divisible
          ? holder.quantity / 100000000
          : holder.quantity,
      }));

      return {
        data: {
          stamp,
          holders: processedHolders,
          sends,
          dispensers,
          dispenses,
          total,
        },
        last_block, // TODO: add type
      };
    } catch (error) {
      console.error("Error in StampController.getStampDetailsById:", error);
      throw error;
    }
  }

  static async getStamps({
    page = 1,
    limit = BIG_LIMIT,
    orderBy = "DESC",
    sortBy = "none",
    type = "all",
    filterBy = [],
    ident = ["STAMP", "SRC-721"],
    collectionId,
    identifier,
    blockIdentifier,
    cacheDuration,
    noPagination = false,
  }: {
    page?: number;
    limit?: number;
    orderBy?: "DESC" | "ASC";
    sortBy?: string;
    type?: "stamps" | "cursed" | "all";
    filterBy?: string[];
    ident?: SUBPROTOCOLS[];
    collectionId?: string;
    identifier?: string | number;
    blockIdentifier?: number | string;
    cacheDuration?: number | "never";
    noPagination?: boolean; // Add this line
  } = {}) {
    try {
      const result = await StampService.getStamps({
        page,
        limit,
        sort_order: orderBy.toLowerCase() as "asc" | "desc",
        type,
        ident,
        all_columns: false,
        collectionId,
        identifier,
        blockIdentifier,
        cacheDuration,
        noPagination,
      });
      if (!result) {
        throw new Error("No stamps found");
      }

      // Apply sorting and filtering if needed
      let stamps = result.stamps;
      if (sortBy !== "none" || filterBy.length > 0) {
        stamps = sortData(filterData(stamps, filterBy), sortBy, orderBy);
      }

      return {
        stamps,
        total: result.total,
        pages: result.pages,
        page: result.page,
        page_size: result.page_size,
      };
    } catch (error) {
      console.error("Error in getStamps:", error);
      throw error;
    }
  }

  static async getStamp(id: string) {
    try {
      const result = await StampService.getStamps({
        identifier: id,
      });

      if (!result) {
        return null;
      }

      return {
        id: result.stamp.id,
        name: result.stamp.name,
        totalStamps: result.total,
      };
    } catch (error) {
      console.error("Error in getStamp:", error);
      throw error;
    }
  }

  static async getMultipleStampCategories(
    categories: { types: string[]; limit: number }[],
  ) {
    const results = await Promise.all(
      categories.map(async (category) => {
        const serviceResult = await StampService.getStamps({
          page: 1,
          limit: category.limit,
          sort_order: "desc",
          type: "stamps",
          ident: category.types as SUBPROTOCOLS[],
          noPagination: false,
        });

        return {
          types: category.types,
          stamps: serviceResult?.stamps ?? [],
          total: serviceResult?.total ?? 0,
        };
      }),
    );

    return results;
  }

  static async getHomePageData() {
    try {
      const [stampCategories, src20Result, poshCollection, recentSales] =
        await Promise.all([
          this.getMultipleStampCategories([
            { types: ["STAMP", "SRC-721"], limit: 6 },
            { types: ["SRC-721"], limit: 6 },
            { types: ["STAMP"], limit: 6 },
            { types: ["SRC-20"], limit: 6 },
          ]),
          Src20Service.fetchAndFormatSrc20Data({
            op: "DEPLOY",
            page: 1,
            limit: 10,
          }),
          CollectionService.getCollectionByName("posh", 6),
          StampService.getRecentSales(20),
        ]);

      return {
        stamps_recent: recentSales,
        stamps_src721: stampCategories[1].stamps,
        stamps_art: stampCategories[2].stamps,
        stamps_src20: stampCategories[3].stamps,
        stamps_posh: poshCollection ? poshCollection.stamps : [],
        src20s: src20Result.data.map(formatSRC20Row),
      };
    } catch (error) {
      console.error("Error in getHomePageData:", error);
      throw error;
    }
  }

  static getIdent(type: string) {
    switch (type) {
      case "src721":
        return ["SRC-721"];
      case "classic":
        return ["STAMP"];
      case "src20":
        return ["SRC-20"];
      default:
        return ["STAMP", "SRC-721"];
    }
  }

  static async getStampFile(id: string) {
    try {
      const row = await StampService.getStampFile(id);
      if (!row) {
        return { type: "notFound" };
      }
    } catch (error) {
      console.error("Error in StampController.getStampFile:", error);
      throw error;
    }
  }
}
