import { StampService } from "$lib/services/stampService.ts";
import { BIG_LIMIT } from "utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "globals";
import { Src20Service } from "$lib/services/src20Service.ts";
import { formatSRC20Row } from "utils/src20Utils.ts";
import { CollectionService } from "$lib/services/collectionService.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { paginate } from "utils/util.ts";
import {
  PaginatedStampBalanceResponseBody,
  ProcessedHolder,
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  StampRow,
} from "globals";
import { DispenserManager, XcpManager } from "$lib/services/xcpService.ts";
import * as base64 from "base64/mod.ts";
import { filterOptions } from "utils/filterOptions.ts";

export class StampController {
  static async getStampDetailsById(
    id: string,
    stampType: STAMP_TYPES = "all",
  ) {
    try {
      const res = await StampService.getStampDetailsById(id, "all", stampType);
      if (!res) {
        return null;
      }

      const {
        asset,
        stamp,
        holders,
        sends,
        dispensers,
        dispenses,
        total,
        last_block,
      } = res;

      if (asset) {
        stamp.divisible = asset.divisible ?? stamp.divisible;
        stamp.locked = asset.locked ?? stamp.locked;
        stamp.supply = asset.supply ?? stamp.supply;
      }

      const processedHolders = this.processHolders(holders);
      const { floorPrice, marketCap } = this.calculatePrices(
        dispensers,
        dispenses,
        stamp,
      );

      return {
        data: {
          stamp: {
            ...stamp,
            floorPrice,
            marketCap,
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

  private static processHolders(holders: HolderRow[]): ProcessedHolder[] {
    return holders.map((holder: HolderRow) => ({
      address: holder.address,
      quantity: holder.divisible
        ? holder.quantity / 100000000
        : holder.quantity,
    }));
  }

  private static calculatePrices(
    dispensers: any[],
    dispenses: any[],
    stamp: any,
  ) {
    let floorPrice: string | number = "priceless";
    let marketCap: string | number = "priceless";

    if (dispensers && dispensers.length > 0) {
      const openDispensers = dispensers.filter(
        (dispenser) => dispenser.give_remaining > 0,
      );
      if (openDispensers.length > 0) {
        const lowestBtcRate = Math.min(
          ...openDispensers.map((dispenser) =>
            dispenser.satoshirate / 100000000
          ),
        );
        floorPrice = lowestBtcRate;
      }
    }

    if (dispenses && dispenses.length > 0 && stamp.supply) {
      const mostRecentDispense = dispenses[0];
      const recentPrice = mostRecentDispense.dispenser_details.satoshirate /
        100000000;
      marketCap = recentPrice * stamp.supply;
    }

    return { floorPrice, marketCap };
  }

  static async getStamps({
    page = 1,
    limit = BIG_LIMIT,
    sortBy = "ASC",
    type = "all",
    filterBy = [],
    ident,
    collectionId,
    identifier,
    blockIdentifier,
    cacheDuration,
    noPagination = false,
    allColumns = false,
    sortColumn = "tx_index",
    suffixFilters,
  }: {
    page?: number;
    limit?: number;
    sortBy?: "DESC" | "ASC";
    type?: STAMP_TYPES;
    filterBy?: STAMP_FILTER_TYPES[] | string;
    ident?: SUBPROTOCOLS[];
    suffixFilters?: STAMP_SUFFIX_FILTERS[];
    collectionId?: string;
    identifier?: string | number;
    blockIdentifier?: number | string;
    cacheDuration?: number | "never";
    noPagination?: boolean;
    allColumns?: boolean;
    sortColumn?: string;
  } = {}) {
    try {
      console.log("StampController.getStamps called with filterBy:", filterBy);

      const filterByArray = typeof filterBy === "string"
        ? filterBy.split(",").filter(Boolean) as STAMP_FILTER_TYPES[]
        : filterBy;

      // Initialize ident based on type
      let finalIdent: SUBPROTOCOLS[] = ident || [];
      if ((!ident || ident.length === 0) && type) {
        if (type === "classic") {
          finalIdent = ["STAMP"];
        } else if (type === "posh") {
          finalIdent = ["SRC-721"];
        } else if (type === "stamps") {
          finalIdent = ["STAMP", "SRC-721"];
        } else if (type === "src20") {
          finalIdent = ["SRC-20"];
        } else if (type === "all") {
          finalIdent = []; // We'll handle 'all' in the repository
        } else {
          finalIdent = [];
        }
      }

      let filterSuffixFilters: STAMP_SUFFIX_FILTERS[] = [];
      if (filterByArray.length > 0) {
        // Extract ident and suffixFilters from filterBy
        const identFromFilter = filterByArray.flatMap((filter) =>
          filterOptions[filter]?.ident || []
        );
        filterSuffixFilters = filterByArray.flatMap((filter) =>
          filterOptions[filter]?.suffixFilters || []
        ) as STAMP_SUFFIX_FILTERS;

        // Combine ident from type and filterBy, removing duplicates
        if (identFromFilter.length > 0) {
          finalIdent = Array.from(new Set([...finalIdent, ...identFromFilter]));
        }

        // When filterBy is defined, suffixFilters are limited to those in filterOptions
        suffixFilters = filterSuffixFilters;
      } else if (!suffixFilters || suffixFilters.length === 0) {
        // If suffixFilters are not provided, use all possible suffixes
        suffixFilters = []; // No suffix filter applied
      }

      const [stampResult, lastBlock] = await Promise.all([
        StampService.getStamps({
          page,
          limit,
          sortBy,
          type,
          ident: finalIdent,
          suffixFilters,
          allColumns,
          collectionId,
          identifier,
          blockIdentifier,
          cacheDuration,
          noPagination,
          filterBy: filterByArray,
          sortColumn,
        }),
        BlockService.getLastBlock(),
      ]);

      if (!stampResult) {
        throw new Error("No stamps found");
      }

      // Prepare concurrent calls for XCP assets and dispensers
      const cpids = stampResult.stamps.map((stamp: StampRow) => stamp.cpid);
      const xcpAssetsPromise = XcpManager.getXcpAssetsByCpids(cpids);

      const dispenserPromises = stampResult.stamps.map((stamp: StampRow) =>
        (stamp.ident === "STAMP" || stamp.ident === "SRC-721")
          ? DispenserManager.getDispensersByCpid(stamp.cpid)
          : Promise.resolve(null)
      );

      // Wait for all promises to resolve
      const [xcpAssets, ...dispensers] = await Promise.all([
        xcpAssetsPromise,
        ...dispenserPromises,
      ]);

      const updatedStamps = stampResult.stamps.map(
        (stamp: StampRow, index: number) => {
          const xcpAsset = xcpAssets.find((asset) =>
            asset.asset === stamp.cpid
          );
          let floorPrice: string | number | undefined = undefined;

          if (stamp.ident === "STAMP" || stamp.ident === "SRC-721") {
            const dispensersForStamp = dispensers[index];
            if (dispensersForStamp && dispensersForStamp.length > 0) {
              const openDispensers = dispensersForStamp.filter(
                (dispenser) => dispenser.give_remaining > 0,
              );
              if (openDispensers.length > 0) {
                const lowestBtcRate = Math.min(
                  ...openDispensers.map((dispenser) =>
                    dispenser.satoshirate / 100000000
                  ),
                );
                floorPrice = lowestBtcRate;
              } else {
                floorPrice = "priceless";
              }
            } else {
              floorPrice = "priceless";
            }
          }

          return {
            ...stamp,
            divisible: xcpAsset?.divisible ?? stamp.divisible,
            supply: xcpAsset?.supply ?? stamp.supply,
            locked: xcpAsset?.locked ?? stamp.locked,
            ...(floorPrice !== undefined && { floorPrice }),
          };
        },
      );

      return {
        page: stampResult.page,
        limit: stampResult.page_size,
        totalPages: stampResult.pages,
        total: stampResult.total,
        last_block: lastBlock,
        data: updatedStamps,
      };
    } catch (error) {
      console.error("Error in getStamps:", error);
      throw error;
    }
  }

  static async getRecentSales(page?: number, limit?: number) {
    try {
      const { recentSales, total } = await StampService.getRecentSales(
        page,
        limit,
      );
      const lastBlock = await BlockService.getLastBlock();
      const totalPages = limit ? Math.ceil(total / limit) : 1;

      return {
        page: page || 1,
        limit: limit || total,
        totalPages,
        total,
        last_block: lastBlock,
        data: recentSales,
      };
    } catch (error) {
      console.error("Error in getRecentSales:", error);
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
      last_block: lastBlock,
      data: stamps,
    };
  }

  static async getMultipleStampCategories(
    categories: {
      types: string[];
      limit: number;
    }[],
  ) {
    const results = await Promise.all(
      categories.map(async (category) => {
        const serviceResult = await StampService.getStamps({
          page: 1,
          limit: category.limit,
          sortBy: "DESC",
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
      const [
        stampCategories,
        src20Result,
        poshCollection,
        recentSales,
        collectionData,
      ] = await Promise.all([
        this.getMultipleStampCategories([
          { types: ["STAMP", "SRC-721"], limit: 6 },
          { types: ["SRC-721"], limit: 6 },
          { types: ["STAMP"], limit: 16 },
          { types: ["SRC-20"], limit: 6 },
        ]),
        Src20Service.fetchAndFormatSrc20Data({
          op: "DEPLOY",
          page: 1,
          limit: 10,
        }),
        CollectionService.getCollectionByName("posh", 8, "DESC"),
        StampService.getRecentSales(6),
        CollectionService.getCollectionNames({
          limit: 4,
          page: 1,
          creator: "",
        }),
      ]);

      return {
        stamps_recent: recentSales,
        stamps_src721: stampCategories[1].stamps,
        stamps_art: stampCategories[2].stamps,
        stamps_src20: stampCategories[3].stamps,
        stamps_posh: poshCollection ? poshCollection.stamps : [],
        src20s: src20Result.data.map(formatSRC20Row),
        collectionData: collectionData.data,
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

  static async getStampFile(id: string, params: string): Promise<Response> {
    try {
      const result = await StampService.getStampFile(id);

      if (!result || result.type === "notFound") {
        return this.redirectToNotAvailable();
      }

      switch (result.type) {
        case "redirect":
          return new Response("", {
            status: 301,
            headers: {
              Location: `/content/${result.fileName}${
                params ? `?${params}` : ""
              }`,
            },
          });
        case "base64":
          return new Response(base64.toUint8Array(result.base64), {
            headers: {
              "Content-Type": result.mimeType || "application/octet-stream",
            },
          });
        default:
          return this.redirectToNotAvailable();
      }
    } catch (error) {
      console.error("Error in StampController.getStampFile:", error);
      throw error;
    }
  }

  private static redirectToNotAvailable(): Response {
    return new Response(null, {
      status: 404,
      headers: {
        "Cache-Control": "no-store, must-revalidate",
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  }

  static async getCreatorNameByAddress(
    address: string,
  ): Promise<string | null> {
    try {
      return await StampService.getCreatorNameByAddress(address);
    } catch (error) {
      console.error("Error in getCreatorNameByAddress:", error);
      throw error;
    }
  }

  static async updateCreatorName(
    address: string,
    newName: string,
  ): Promise<boolean> {
    try {
      return await StampService.updateCreatorName(address, newName);
    } catch (error) {
      console.error("Error in updateCreatorName:", error);
      throw error;
    }
  }
}
