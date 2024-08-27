import { StampService } from "$lib/services/stampService.ts";
import { filterData, sortData } from "utils/stampUtils.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "globals";
import { Src20Service } from "$lib/services/src20Service.ts";
import { formatSRC20Row } from "utils/src20Utils.ts";
import { CollectionService } from "$lib/services/collectionService.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { paginate } from "utils/util.ts";
import { PaginatedStampBalanceResponseBody } from "globals";

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

      // Calculate floor price
      let floorPrice = "priceless";
      if (dispensers && dispensers.length > 0) {
        const openDispensers = dispensers.filter(
          (dispenser) => dispenser.give_remaining > 0,
        );
        if (openDispensers.length > 0) {
          const lowestBtcRate = Math.min(
            ...openDispensers.map((dispenser) => dispenser.btcrate),
          );
          floorPrice = lowestBtcRate;
        }
      }

      return {
        data: {
          stamp: {
            ...stamp,
            floorPrice,
          },
          holders: processedHolders,
          sends,
          dispensers,
          dispenses,
          total,
        },
        last_block,
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
    ident,
    collectionId,
    identifier,
    blockIdentifier,
    cacheDuration,
    noPagination = false,
    allColumns = false,
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
    noPagination?: boolean;
    allColumns?: boolean;
  } = {}) {
    try {
      const [result, lastBlock] = await Promise.all([
        StampService.getStamps({
          page,
          limit,
          sort_order: orderBy.toLowerCase() as "asc" | "desc",
          type,
          ident,
          allColumns,
          collectionId,
          identifier,
          blockIdentifier,
          cacheDuration,
          noPagination,
        }),
        BlockService.getLastBlock(),
      ]);

      if (!result) {
        throw new Error("No stamps found");
      }

      let stamps = result.stamps;
      if (sortBy !== "none" || filterBy.length > 0) {
        stamps = sortData(filterData(stamps, filterBy), sortBy, orderBy);
      }

      return {
        page: result.page,
        limit: result.page_size,
        totalPages: result.pages,
        total: result.total,
        last_block: lastBlock.last_block || lastBlock,
        data: result.stamps,
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

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
  ): Promise<PaginatedStampBalanceResponseBody> {
    const [{ stamps, total }, lastBlock] = await Promise.all([
      StampService.getStampBalancesByAddress(address, limit, page),
      BlockService.getLastBlock(),
    ]);

    const pagination = paginate(total, page, limit);

    return {
      ...pagination,
      last_block: lastBlock.last_block,
      data: stamps,
    };
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
