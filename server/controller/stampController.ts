import { StampService } from "$server/services/stampService.ts";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import { HolderRow, SUBPROTOCOLS } from "globals";
import { Src20Service } from "$server/services/src20/queryService.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { BlockService } from "$server/services/blockService.ts";
import { paginate } from "$lib/utils/util.ts";
import {
  PaginatedStampBalanceResponseBody,
  ProcessedHolder,
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  StampRow,
} from "globals";
import { DispenserManager } from "$server/services/xcpService.ts";
import { decodeBase64 } from "@std/encoding";
import { filterOptions } from "$lib/utils/filterOptions.ts";
import { Dispense, Dispenser } from "$types/index.d.ts";
import { CollectionController } from "./collectionController.ts";
import { Src20Controller } from "./src20Controller.ts";

export class StampController {
  static async getStampDetailsById(id: string, stampType: STAMP_TYPES = "all") {
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
    dispensers: Dispenser[],
    dispenses: Dispense[],
    stamp: StampRow,
  ) {
    console.log("Entering calculatePrices method");
    console.log("Dispensers:", JSON.stringify(dispensers, null, 2));
    console.log("Dispenses:", JSON.stringify(dispenses, null, 2));
    console.log("Stamp:", JSON.stringify(stamp, null, 2));

    let floorPrice: string | number = "priceless";
    let marketCap: string | number = "priceless";

    if (dispensers && dispensers.length > 0) {
      console.log("Dispensers array is not empty");
      const openDispensers = dispensers.filter((dispenser) => {
        console.log("Checking dispenser:", JSON.stringify(dispenser, null, 2));
        return dispenser && dispenser.give_remaining > 0;
      });
      console.log("Open dispensers:", JSON.stringify(openDispensers, null, 2));

      if (openDispensers.length > 0) {
        console.log("There are open dispensers");
        const lowestBtcRate = Math.min(
          ...openDispensers.map((dispenser) => {
            console.log(
              "Processing dispenser:",
              JSON.stringify(dispenser, null, 2),
            );
            if (dispenser && dispenser.satoshirate !== undefined) {
              return dispenser.satoshirate / 100000000;
            } else {
              console.log("Warning: dispenser or satoshirate is undefined");
              return Infinity;
            }
          }),
        );
        console.log("Lowest BTC rate:", lowestBtcRate);
        floorPrice = lowestBtcRate !== Infinity ? lowestBtcRate : "priceless";
      }
    } else {
      console.log("Dispensers array is empty or undefined");
    }

    if (dispenses && dispenses.length > 0 && stamp.supply) {
      console.log("Calculating market cap");
      const mostRecentDispense = dispenses[0];
      console.log(
        "Most recent dispense:",
        JSON.stringify(mostRecentDispense, null, 2),
      );

      // Find the parent dispenser for the most recent dispense
      const parentDispenser = dispensers.find((d) =>
        d.tx_hash === mostRecentDispense.dispenser_tx_hash
      );

      if (parentDispenser && parentDispenser.satoshirate !== undefined) {
        const recentPrice = parentDispenser.satoshirate / 100000000; // Convert satoshis to BTC
        marketCap = recentPrice * stamp.supply;
        console.log("Calculated market cap:", marketCap);
      } else {
        console.log(
          "Warning: Parent dispenser not found or satoshirate is missing for the most recent dispense",
        );
      }
    }

    console.log("Final floorPrice:", floorPrice);
    console.log("Final marketCap:", marketCap);
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
    collectionId?: string | string[];
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
          finalIdent = [];
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
        ) as STAMP_SUFFIX_FILTERS[];

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

      // Prepare concurrent calls for dispensers
      const dispenserPromises = stampResult.stamps.map((stamp: StampRow) =>
        (stamp.ident === "STAMP" || stamp.ident === "SRC-721")
          ? DispenserManager.getDispensersByCpid(stamp.cpid)
          : Promise.resolve(null)
      );

      // Wait for all dispenser promises to resolve
      const dispensers = await Promise.all(dispenserPromises);

      const updatedStamps = stampResult.stamps.map(
        (stamp: StampRow, index: number) => {
          let floorPrice: string | number | undefined = undefined;

          if (stamp.ident === "STAMP" || stamp.ident === "SRC-721") {
            const dispensersForStamp = dispensers[index];
            if (dispensersForStamp && dispensersForStamp.length > 0) {
              const openDispensers = dispensersForStamp.filter(
                (dispenser) => dispenser.give_remaining > 0,
              );
              if (openDispensers.length > 0) {
                const lowestBtcRate = Math.min(
                  ...openDispensers.map(
                    (dispenser) => dispenser.satoshirate / 100000000,
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
      idents: SUBPROTOCOLS[];
      limit: number;
    }[],
  ) {
    const results = await Promise.all(
      categories.map(async (category) => {
        const serviceResult = await StampService.getStamps({
          page: 1,
          limit: category.limit,
          sortBy: "DESC",
          type: "all",
          ident: category.idents,
          noPagination: false,
        });

        return {
          types: category.idents,
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
        trendingSrc20s, // <-- Add this line
        recentSales,
        collectionData,
      ] = await Promise.all([
        this.getMultipleStampCategories([
          { idents: ["STAMP", "SRC-721"], limit: 6 },
          { idents: ["SRC-721"], limit: 6 },
          { idents: ["STAMP"], limit: 16 },
          // Removed SRC20 from stamp categories
        ]),
        // Fetch SRC20 data for the SRC20DeployTable
        Src20Controller.fetchSrc20DetailsWithHolders(null, {
          op: "DEPLOY",
          page: 1,
          limit: 5,
          sortBy: "ASC",
        }),
        // Fetch trending SRC20 tokens for SRC20TrendingMints component
        Src20Controller.fetchTrendingTokens(null, 5, 1, 1000), // <-- Added this line
        this.getRecentSales(1, 6),
        CollectionController.getCollectionNames({
          limit: 4,
          page: 1,
          creator: "",
        }),
      ]);

      // Fetch the "posh" collection to get its collection_id
      const poshCollection = await CollectionService.getCollectionByName(
        "posh",
      );

      let stamps_posh = [];
      if (poshCollection) {
        const poshCollectionId = poshCollection.collection_id;

        // Fetch stamps from the "posh" collection with limit and sortBy
        const poshStampsResult = await this.getStamps({
          collectionId: poshCollectionId,
          page: 1,
          limit: 8, // Limit to 8 stamps
          sortBy: "DESC", // Adjust sort order if needed
        });

        stamps_posh = poshStampsResult.data; // Extract the stamps array
      } else {
        console.warn("Posh collection not found");
      }

      return {
        stamps_recent: recentSales.data,
        stamps_src721: stampCategories[1].stamps,
        stamps_art: stampCategories[2].stamps,
        stamps_posh,
        src20s: src20Result.data,
        trendingSrc20s: trendingSrc20s.data, // <-- Add this line
        collectionData: collectionData.data,
      };
    } catch (error) {
      console.error("Error in getHomePageData:", error);
      throw error;
    }
  }

  static async getCollectionPageData() {
    try {
      const [
        stampCategories,
      ] = await Promise.all([
        this.getMultipleStampCategories([
          { idents: ["SRC-721"], limit: 12 },
        ]),
      ]);

      // Fetch the "posh" collection to get its collection_id
      const poshCollection = await CollectionService.getCollectionByName(
        "posh",
      );

      let stamps_posh = [];
      if (poshCollection) {
        const poshCollectionId = poshCollection.collection_id;

        // Fetch stamps from the "posh" collection with limit and sortBy
        const poshStampsResult = await this.getStamps({
          collectionId: poshCollectionId,
          page: 1,
          limit: 12, // Limit to 8 stamps
          sortBy: "DESC", // Adjust sort order if needed
        });

        stamps_posh = poshStampsResult.data; // Extract the stamps array
      } else {
        console.warn("Posh collection not found");
      }

      return {
        stamps_src721: stampCategories[0].stamps,
        stamps_posh,
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
          return new Response(decodeBase64(result.base64), {
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
