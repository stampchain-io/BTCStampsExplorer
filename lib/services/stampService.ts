import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { StampRepository } from "$lib/database/index.ts";
import { BlockService } from "$lib/services/blockService.ts";
import {
  get_dispensers,
  get_dispenses,
  get_holders,
  get_sends,
} from "utils/xcp.ts";
import { StampBalance, SUBPROTOCOLS } from "globals";

export class StampService {
  static async getStampDetailsById(id: string) {
    console.log(`getStampDetailsById called with id: ${id}`);
    try {
      return await withDatabaseClient(async (client) => {
        console.log(`Querying database for stamp with id: ${id}`);
        const stampResult = await StampRepository.getStampsFromDb({
          identifier: id,
          all_columns: true,
          noPagination: true,
          cacheDuration: "never",
        });

        console.log(`Query result:`, stampResult);

        if (!stampResult || stampResult.rows.length === 0) {
          console.log(`No stamp found for id: ${id}`);
          throw new Error(`Error: Stamp ${id} not found`);
        }

        const stamp = stampResult.rows[0];
        const cpid = stamp.cpid;

        const [holders, dispensers, sends, dispenses, total, lastBlock] =
          await Promise.all([
            get_holders(cpid),
            get_dispensers(cpid),
            get_sends(cpid),
            get_dispenses(cpid),
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
      });
    } catch (error) {
      console.error("Error in getStampDetailsById:", error);
      throw error;
    }
  }

  static async getStamps(options: {
    limit?: number;
    page?: number;
    page_size?: number;
    sort_order?: "asc" | "desc";
    type?: "stamps" | "cursed" | "all";
    ident?: SUBPROTOCOLS | SUBPROTOCOLS[] | string;
    identifier?: string | number;
    blockIdentifier?: number | string;
    all_columns?: boolean;
    noPagination?: boolean;
    cacheDuration?: number | "never";
    collectionId?: string;
  }) {
    return await withDatabaseClient(async (client) => {
      try {
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
          if (!stamps.rows.length) {
            return null;
          }
          return {
            stamp: stamps.rows[0],
            total: total.rows[0].total,
          };
        }

        return {
          stamps: stamps.rows,
          total: total.rows[0].total,
        };
      } catch (error) {
        console.error("Error in getStamps:", error);
        throw error;
      }
    });
  }

  static async getStampFile(id: string) {
    return await withDatabaseClient(async (client) => {
      const file_name = await StampRepository.getStampFilenameByIdFromDb(
        client,
        id,
      );

      if (!file_name) {
        return { type: "notFound" };
      }

      if (file_name.indexOf(".unknown") > -1) {
        const stampData = await this.getStamps({
          identifier: id,
          all_columns: true,
          noPagination: true,
        });
        if (stampData && stampData.stamp && "stamp_base64" in stampData.stamp) {
          return { type: "base64", base64: stampData.stamp.stamp_base64 };
        } else {
          return { type: "notFound" };
        }
      }

      return { type: "redirect", fileName: file_name };
    });
  }

  static async getStampBalancesByAddress(
    address: string,
    limit: number,
    page: number,
  ) {
    return await withDatabaseClient(async () => {
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
    });
  }
}
