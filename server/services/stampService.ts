import { StampRepository } from "$server/database/index.ts";
import { BlockService } from "$server/services/blockService.ts";
import {
  STAMP_FILTER_TYPES,
  STAMP_SUFFIX_FILTERS,
  STAMP_TYPES,
  SUBPROTOCOLS,
} from "globals";
import { DispenserManager } from "$server/services/xcpService.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { BIG_LIMIT } from "$lib/utils/constants.ts";
import { getMimeType, getFileSuffixFromMime } from "$lib/utils/imageUtils.ts";
import { DispenserFilter } from "$types/index.d.ts";
import { formatBTCAmount } from "$lib/utils/formatUtils.ts";

export class StampService {
  static async getStampDetailsById(
    id: string,
    dispenserFilter: DispenserFilter = "all",
    stampType: STAMP_TYPES = "all",
  ) {
    console.log(`Fetching stamp details for ID: ${id}, Type: ${stampType}`);
    const stampResult = await this.getStamps({
      identifier: id,
      allColumns: true,
      noPagination: true,
      cacheDuration: "never",
      type: stampType,
    });

    console.log("Stamp result:", JSON.stringify(stampResult, null, 2));

    if (!stampResult) {
      console.error(`Stamp ${id} not found in getStamps result`);
      throw new Error(`Error: Stamp ${id} not found`);
    }

    const stamp = this.extractStamp(stampResult);
    console.log("Extracted stamp:", JSON.stringify(stamp, null, 2));

    const cpid = stamp.cpid;

    const [asset, holders, dispensers, sends, dispenses, total, lastBlock] =
      await this.fetchRelatedData(stamp, cpid, dispenserFilter);

    console.log("Related data fetched successfully");

    return {
      last_block: lastBlock,
      asset: asset ? asset.result : null,
      stamp,
      holders,
      sends,
      dispensers,
      dispenses,
      total: total.rows[0]?.total,
    };
  }

  private static extractStamp(stampResult: any) {
    console.log(
      "Extracting stamp from result:",
      JSON.stringify(stampResult, null, 2),
    );

    // Access 'stampResult.stamps' instead of 'stampResult.rows'
    if (Array.isArray(stampResult.stamps)) {
      if (stampResult.stamps.length === 0) {
        console.error("Stamp not found: empty stamps array");
        throw new Error(`Error: Stamp not found`);
      }
      return stampResult.stamps[0];
    } else if (stampResult.stamp) {
      return stampResult.stamp;
    } else {
      return stampResult;
    }
  }

  private static async fetchRelatedData(
    stamp: any,
    cpid: string,
    filter: DispenserFilter,
  ) {
    const isStampOrSrc721 = stamp.ident === "STAMP" ||
      stamp.ident === "SRC-721";

    console.log(
      `Fetching related data for CPID: ${cpid}, Filter: ${filter}, IsStampOrSrc721: ${isStampOrSrc721}`,
    );

    const results = await Promise.all([
      isStampOrSrc721 ? XcpManager.getXcpAsset(cpid) : Promise.resolve(null),
      isStampOrSrc721
        ? XcpManager.getXcpHoldersByCpid(cpid)
        : Promise.resolve([]),
      isStampOrSrc721
        ? DispenserManager.getDispensersByCpid(cpid, filter)
        : Promise.resolve([]),
      isStampOrSrc721
        ? XcpManager.getXcpSendsByCPID(cpid)
        : Promise.resolve([]),
      isStampOrSrc721
        ? DispenserManager.getDispensesByCpid(cpid)
        : Promise.resolve([]),
      StampRepository.getTotalStampCountFromDb({ type: "stamps" }),
      BlockService.getLastBlock(),
    ]);

    console.log(
      `Fetched related data for CPID: ${cpid}, Results: ${
        JSON.stringify(results)
      }`,
    );

    return results;
  }

  static async getStamps(options) {

    if (options.collectionId && (!options.groupBy || !options.groupBySubquery)) {
      options = {
        ...options,
        groupBy: "collection_id",
        groupBySubquery: true
      };
    }

    const result = await StampRepository.getStampsFromDb(options);


    if (!result) {
      throw new Error("No stamps found");
    }

    return result;
  }

  static async getStampFile(id: string) {
    const result = await StampRepository.getStampFilenameByIdFromDb(id);
    if (!result?.fileName || !result?.stamp_mimetype) {
      return { type: "notFound" };
    }

    const suffix = getFileSuffixFromMime(result.stamp_mimetype);
    if (suffix === "unknown") {
      if (result.base64) {
        return { 
          type: "base64", 
          base64: result.base64, 
          mimeType: result.stamp_mimetype 
        };
      }
      return { type: "notFound" };
    }

    return { 
      type: "redirect", 
      fileName: result.fileName, 
      base64: result.base64 
    };
  }

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
  ) {
    const [totalResult, stamps] = await Promise.all([
      StampRepository.getCountStampBalancesByAddressFromDb(address),
      StampRepository.getStampBalancesByAddressFromDb(address, limit, page),
    ]);

    const total = totalResult.rows[0]?.total || 0;

    return { stamps, total };
  }

  static async getAllCPIDs() {
    return await StampRepository.getALLCPIDs();
  }

  static mapDispensesWithRates(dispenses, dispensers) {
    const dispenserRates = new Map(
      dispensers.map((d) => [d.tx_hash, d.satoshirate]),
    );
    return dispenses.map((dispense) => ({
      ...dispense,
      satoshirate: dispenserRates.get(dispense.dispenser_tx_hash) || 0,
    }));
  }

  static async getRecentSales(page?: number, limit?: number) {
    // Fetch dispense events and extract unique asset values
    const dispenseEvents = await XcpManager.fetchDispenseEvents(500); // Fetch recent dispense events
    const uniqueAssets = [
      ...new Set(dispenseEvents.map((event) => event.params.asset)),
    ];

    const stampDetails = await this.getStamps({
      identifier: uniqueAssets,
      allColumns: true,
      noPagination: true,
    });

    const stampDetailsMap = new Map(
      stampDetails.stamps.map((stamp) => [stamp.cpid, stamp]),
    );

    const allRecentSales = dispenseEvents
      .map((event) => {
        const stamp = stampDetailsMap.get(event.params.asset);
        if (!stamp) return null;
        return {
          ...stamp,
          sale_data: {
            btc_amount: Number(formatBTCAmount(event.params.btc_amount, { 
              includeSymbol: false 
            })),
            block_index: event.block_index,
            tx_hash: event.tx_hash,
          },
        };
      })
      .filter(Boolean)
      .sort((a, b) => b.sale_data.block_index - a.sale_data.block_index);

    const total = allRecentSales.length;

    if (page !== undefined && limit !== undefined) {
      const startIndex = (page - 1) * limit;
      const endIndex = startIndex + limit;
      const paginatedSales = allRecentSales.slice(startIndex, endIndex);
      return { recentSales: paginatedSales, total };
    }

    return { recentSales: allRecentSales, total };
  }

  static async getCreatorNameByAddress(
    address: string,
  ): Promise<string | null> {
    return await StampRepository.getCreatorNameByAddress(address);
  }

  static async updateCreatorName(
    address: string,
    newName: string,
  ): Promise<boolean> {
    return await StampRepository.updateCreatorName(address, newName);
  }
}
