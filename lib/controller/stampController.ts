import { StampService } from "$lib/services/stampService.ts";
import { filterData, sortData } from "utils/stampUtils.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { HolderRow } from "globals";
import { Src20Service } from "$lib/services/src20Service.ts";
import { formatSRC20Row } from "utils/src20Utils.ts";
import { CollectionService } from "$lib/services/collectionService.ts";

export class StampController {
  static async getStampDetailsById(id: string) {
    try {
      const res = await StampService.getStampDetailsById(id);
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

  static async getStamps(
    page = 1,
    page_size = BIG_LIMIT,
    orderBy: "DESC" | "ASC" = "DESC",
    sortBy = "none",
    filterBy: string[] = [],
    typeBy = ["STAMP", "SRC-721"],
  ) {
    try {
      const result = await StampService.getStamps({
        page,
        page_size,
        sort_order: orderBy.toLowerCase() as "asc" | "desc",
        type: "stamps",
        ident: typeBy,
        noPagination: false,
        all_columns: false,
      });

      const sortedAndFilteredStamps = sortData(
        filterData(result.stamps, filterBy),
        sortBy,
        orderBy,
      );

      const paginatedData = sortedAndFilteredStamps.slice(
        (page - 1) * page_size,
        page * page_size,
      );

      const totalPages = Math.ceil(result.total / page_size);

      return {
        stamps: paginatedData,
        total: result.total,
        pages: totalPages,
        page: page,
        page_size: page_size,
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
          page_size: category.limit,
          sort_order: "desc",
          type: "stamps",
          ident: category.types,
          noPagination: false,
        });

        return {
          types: category.types,
          stamps: serviceResult.stamps,
          total: serviceResult.total,
        };
      }),
    );

    return results;
  }

  static async getHomePageData(
    type: string | null,
    page: number,
    page_size: number,
    filterBy: string[] = [],
    sortBy: string = "none",
    orderBy: "DESC" | "ASC" = "DESC",
  ) {
    try {
      if (!type) {
        const [stampCategories, src20Result, poshCollection] = await Promise
          .all([
            this.getMultipleStampCategories([
              { types: ["STAMP", "SRC-721"], limit: 6 },
              { types: ["SRC-721"], limit: 6 },
              { types: ["STAMP"], limit: 6 },
              { types: ["SRC-20"], limit: 6 },
            ]),
            Src20Service.fetchAndFormatSrc20Data({
              op: "DEPLOY",
              page,
              limit: page_size,
            }),
            CollectionService.getCollectionByName("posh"),
          ]);

        return {
          stamps_recent: stampCategories[0].stamps,
          stamps_src721: stampCategories[1].stamps,
          stamps_art: stampCategories[2].stamps,
          stamps_src20: stampCategories[3].stamps,
          stamps_posh: poshCollection ? poshCollection.stamps : [],
          src20s: src20Result.data.map(formatSRC20Row),
          pages_src20: src20Result.pages,
          page_src20: src20Result.page,
          page_size_src20: src20Result.page_size,
          type,
        };
      } else {
        const typeBy = this.getTypeBy(type);
        const stampResult = await this.getStamps(
          page,
          page_size,
          orderBy,
          sortBy,
          filterBy,
          typeBy,
        );

        return {
          ...stampResult,
          filterBy,
          sortBy,
          type,
        };
      }
    } catch (error) {
      console.error("Error in getHomePageData:", error);
      throw error;
    }
  }

  static getTypeBy(type: string) {
    switch (type) {
      case "src721":
        return ["SRC-721"];
      case "art":
        return ["STAMP"];
      case "src20":
        return ["SRC-20"];
      default:
        return ["STAMP", "SRC-721"];
    }
  }

  static async getStampFile(id: string) {
    try {
      return await StampService.getStampFile(id);
    } catch (error) {
      console.error("Error in StampController.getStampFile:", error);
      throw error;
    }
  }
}
