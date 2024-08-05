import { StampRepository } from "$lib/database/index.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { get_holders, get_sends } from "$lib/services/xcpService.ts";
import { StampBalance, SUBPROTOCOLS } from "globals";
import { DispenserManager } from "$lib/services/xcpService.ts";
import { XcpManager } from "$lib/services/xcpService.ts";

export class StampService {
  static async getStampDetailsById(
    id: string,
    filter: "open" | "closed" | "all" = "open",
  ) {
    console.log(`getStampDetailsById called with id: ${id}`);
    const stampResult = await StampRepository.getStampsFromDb({
      identifier: id,
      all_columns: true,
      noPagination: true,
      cacheDuration: "never",
    });

    if (!stampResult || stampResult.rows.length === 0) {
      throw new Error(`Error: Stamp ${id} not found`);
    }

    const stamp = stampResult.rows[0];
    const cpid = stamp.cpid;

    const [holders, dispensers, sends, dispenses, total, lastBlock] =
      await Promise.all([
        get_holders(cpid),
        DispenserManager.getDispensersByCpid(cpid, filter),
        get_sends(cpid),
        DispenserManager.getDispensesByCpid(cpid),
        StampRepository.getTotalStampCountFromDb("stamps"),
        BlockService.getLastBlock(),
      ]);

    return {
      last_block: lastBlock.last_block,
      stamp,
      holders,
      sends,
      dispensers,
      dispenses,
      total: total.rows[0].total,
    };
  }

  static async getStamps(options: {
    page?: number;
    limit?: number;
    sort_order?: "asc" | "desc";
    type?: "stamps" | "cursed" | "all";
    ident?: SUBPROTOCOLS[];
    all_columns?: boolean;
    collectionId?: string;
    identifier?: string | number;
    blockIdentifier?: number | string;
    cacheDuration?: number | "never";
    noPagination?: boolean;
    page_size?: number;
  }) {
    const isSingleStamp = !!options.identifier;
    const [stamps, total] = await Promise.all([
      StampRepository.getStampsFromDb({
        ...options,
        limit: options.page_size || options.limit,
        all_columns: isSingleStamp ? true : options.all_columns,
        noPagination: isSingleStamp ? true : options.noPagination,
        cacheDuration: isSingleStamp ? "never" : options.cacheDuration,
      }),
      StampRepository.getTotalStampCountFromDb(
        options.type || "stamps",
        options.ident,
      ),
    ]);

    if (isSingleStamp) {
      return !stamps.rows.length
        ? null
        : { stamp: stamps.rows[0], total: total.rows[0].total };
    }

    return { stamps: stamps.rows, total: total.rows[0].total };
  }

  static async getStampFile(id: string) {
    const file_name = await StampRepository.getStampFilenameByIdFromDb(id);

    if (!file_name) {
      return { type: "notFound" };
    }

    if (file_name.indexOf(".unknown") > -1) {
      const stampData = await this.getStamps({
        identifier: id,
        all_columns: true,
        noPagination: true,
      });
      if (stampData?.stamp?.stamp_base64) {
        return { type: "base64", base64: stampData.stamp.stamp_base64 };
      }
      return { type: "notFound" };
    }

    return { type: "redirect", fileName: file_name };
  }

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
  ) {
    const totalStamps = await StampRepository
      .getCountStampBalancesByAddressFromDb(address) as {
        rows: { total: number }[];
      };
    const total = totalStamps.rows[0]?.total || 0;

    let stamps: StampBalance[] = [];
    if (total !== 0) {
      stamps = await StampRepository.getStampBalancesByAddressFromDb(
        address,
        limit,
        page,
      );
    }

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

  static async getRecentSales(limit: number = 6) {
    const [dispenseEvents, cpids] = await Promise.all([
      XcpManager.fetchDispenseEvents(500),
      this.getAllCPIDs(),
    ]);

    const cpidMap = new Map(cpids.map((row) => [row.cpid, row.stamp]));

    const recentSales = await Promise.all(
      dispenseEvents
        .filter((event) => cpidMap.has(event.params.asset))
        .map(async (event) => {
          const stampDetails = await this.getStamps({
            identifier: cpidMap.get(event.params.asset),
            all_columns: true,
            noPagination: true,
          });
          return {
            ...stampDetails.stamp,
            sale_data: {
              btc_amount: event.params.btc_amount,
              block_index: event.block_index,
              tx_hash: event.tx_hash,
            },
          };
        }),
    );

    return recentSales
      .sort((a, b) => b.sale_data.block_index - a.sale_data.block_index)
      .slice(0, limit);
  }
}
