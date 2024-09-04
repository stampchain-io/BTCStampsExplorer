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
import { DispenserManager, XcpManager } from "$lib/services/xcpService.ts";
import * as base64 from "base64/mod.ts";
const NO_DISPENSERS = Symbol("NO_DISPENSERS");

export class InMemoryCacheService {
  private static cache: { [key: string]: { data: any; expiry: number } } = {};

  static set(key: string, data: any, duration: number): void {
    const expiry = Date.now() + duration;
    this.cache[key] = { data, expiry };
  }

  static get(key: string): any | null {
    const item = this.cache[key];
    if (item && item.expiry > Date.now()) {
      return item.data;
    }
    delete this.cache[key];
    return null;
  }
}

export class StampController {
  private static CacheService = InMemoryCacheService;

  private static async getXcpAssetsWithInMemoryCache(): Promise<any[]> {
    const cacheKey = "xcp_assets";
    const cacheDuration = 10 * 60 * 1000; // 10 minutes in milliseconds

    let xcpAssets = StampController.CacheService.get(cacheKey);
    if (!xcpAssets) {
      xcpAssets = await XcpManager.getAllXcpAssets();
      StampController.CacheService.set(cacheKey, xcpAssets, cacheDuration);
    }

    return xcpAssets;
  }

  private static async getDispensersWithCache(cpid: string): Promise<any[]> {
    const cacheKey = `dispensers_${cpid}`;
    const cacheDuration = 10 * 60 * 1000; // 10 minutes in milliseconds

    let dispensers = StampController.CacheService.get(cacheKey);
    if (dispensers === NO_DISPENSERS) {
      return null;
    }
    console.log("Dispensers from cache:", dispensers);
    if (!dispensers) {
      dispensers = await DispenserManager.getDispensersByCpid(cpid);
      StampController.CacheService.set(
        cacheKey,
        dispensers ?? NO_DISPENSERS,
        cacheDuration,
      );
    }

    return dispensers;
  }

  static async getStampDetailsById(id: string) {
    try {
      const res = await StampService.getStampDetailsById(id, "all");
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
      const [stampResult, lastBlock, xcpAssets] = await Promise.all([
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
        this.getXcpAssetsWithInMemoryCache(),
      ]);

      if (!stampResult) {
        throw new Error("No stamps found");
      }

      const updatedStamps = await Promise.all(
        stampResult.stamps.map(async (stamp) => {
          const xcpAsset = xcpAssets.find((asset) =>
            asset.asset === stamp.cpid
          );
          let floorPrice: string | number | undefined = undefined;

          if (stamp.ident === "STAMP" || stamp.ident === "SRC-721") {
            const dispensers = await this.getDispensersWithCache(stamp.cpid);

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
        }),
      );

      let stamps = updatedStamps;
      if (sortBy !== "none" || filterBy.length > 0) {
        stamps = sortData(filterData(stamps, filterBy), sortBy, orderBy);
      }

      return {
        page: stampResult.page,
        limit: stampResult.page_size,
        totalPages: stampResult.pages,
        total: stampResult.total,
        last_block: lastBlock,
        data: stamps,
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
            { types: ["STAMP"], limit: 12 },
            { types: ["SRC-20"], limit: 6 },
          ]),
          Src20Service.fetchAndFormatSrc20Data({
            op: "DEPLOY",
            page: 1,
            limit: 10,
          }),
          CollectionService.getCollectionByName("posh", 4, "asc"),
          StampService.getRecentSales(6),
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
          return new Response(null, { status: 404 });
      }
    } catch (error) {
      console.error("Error in StampController.getStampFile:", error);
      throw error;
    }
  }

  private static redirectToNotAvailable(): Response {
    return new Response("", {
      status: 301,
      headers: {
        Location: `/content/not-available.png`,
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
