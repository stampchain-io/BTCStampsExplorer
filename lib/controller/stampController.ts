import { StampService } from "$lib/services/stampService.ts";
import { filterData, sortData } from "utils/stampUtils.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { HolderRow, SRC20Row } from "globals";
import { Src20Controller } from "$lib/controller/src20Controller.ts";

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
        no_pagination: true,
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
      const result = await StampService.getStamp(id);

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
          sort_order: "asc",
          type: "stamps",
          ident: category.types,
          no_pagination: false,
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
    orderBy: "ASC" | "DESC" = "DESC",
  ) {
    if (!type) {
      const stampCategories = await this.getMultipleStampCategories([
        { types: ["STAMP", "SRC-721"], limit: 6 },
        { types: ["SRC-721"], limit: 6 },
        { types: ["STAMP"], limit: 6 },
        { types: ["SRC-20"], limit: 6 },
      ]);

      const src20Result = await Src20Controller.getSrc20s(page, page_size);

      return {
        stamps_recent: stampCategories[0],
        stamps_src721: stampCategories[1],
        stamps_art: stampCategories[2],
        stamps_src20: stampCategories[3],
        stamps_news: stampCategories[0],
        src20s: src20Result.src20s.map(this.formatSRC20Row),
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
  }

  static formatSRC20Row(row: SRC20Row) {
    return {
      ...row,
      max: row.max ? row.max.toString() : null,
      lim: row.lim ? row.lim.toString() : null,
      amt: row.amt ? row.amt.toString() : null,
    };
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
