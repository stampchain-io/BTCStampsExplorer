import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { StampRepository } from "$lib/database/index.ts";
import { BlockService } from "$lib/services/blockService.ts";
import {
  get_dispensers,
  get_dispenses,
  get_holders,
  get_sends,
} from "utils/xcp.ts";

export class StampService {
  static async getStampDetailsById(id: string) {
    console.log(`getStampDetailsById called with id: ${id}`);
    try {
      return await withDatabaseClient(async (client) => {
        console.log(`Querying database for stamp with id: ${id}`);
        const stampResult = await StampRepository.getStampsFromDb(client, {
          identifier: id,
          all_columns: true,
          no_pagination: true,
          cache_duration: "never",
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
            StampRepository.getTotalStampCountFromDb(client, "stamps"),
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
    page?: number;
    page_size?: number;
    sort_order?: "asc" | "desc";
    type?: "stamps" | "cursed" | "all";
    ident?: string | string[];
    identifier?: string | number;
    all_columns?: boolean;
    no_pagination?: boolean;
  }) {
    return await withDatabaseClient(async (client) => {
      try {
        const [stamps, total] = await Promise.all([
          StampRepository.getStampsFromDb(client, options),
          StampRepository.getTotalStampCountFromDb(
            client,
            options.type || "stamps",
            options.ident,
          ),
        ]);

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

  static async getStamp(id: string) {
    try {
      return await withDatabaseClient(async (client) => {
        const stampResult = await StampRepository.getStampsFromDb(client, {
          identifier: id,
          all_columns: true,
          no_pagination: true,
          cache_duration: "never",
        });

        if (!stampResult || stampResult.rows.length === 0) {
          return null;
        }

        const stamp = stampResult.rows[0];
        const total = await StampRepository.getTotalStampCountFromDb(
          client,
          "stamps",
        );

        return {
          stamp,
          total: total.rows[0].total,
        };
      });
    } catch (error) {
      console.error("Error in getStamp:", error);
      throw error;
    }
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
        const stampData = await this.getStamp(id);
        if (stampData && stampData.stamp && "stamp_base64" in stampData.stamp) {
          return { type: "base64", base64: stampData.stamp.stamp_base64 };
        } else {
          return { type: "notFound" };
        }
      }

      return { type: "redirect", fileName: file_name };
    });
  }
}
