import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { UTXOService } from "$server/services/transaction/utxoService.ts";
import type { UTXO } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

export const handler: Handlers = {
  async GET(req: Request) {
    const utxoService = new UTXOService();
    try {
      const url = new URL(req.url);
      const address = url.searchParams.get("address");
      const excludeAssets = url.searchParams.get("excludeAssets") === "true";

      if (!address) {
        return ResponseUtil.badRequest("Address parameter is required");
      }

      logger.debug("api-utxo-query", {
        message: "API UTXO query request received",
        address,
        excludeAssets,
      });

      let utxos: UTXO[];

      if (excludeAssets) {
        // Use selectUTXOsForTransaction to get filtered UTXOs
        // This method within UTXOService now uses CommonUTXOService indirectly
        // and handles its own filtering including stamp UTXOs.
        // We pass minimal fee/vouts as we only care about the spendable, non-stamp UTXOs list.
        try {
          const result = await utxoService.selectUTXOsForTransaction(
            address,
            [], // Empty outputs array as we just want available UTXOs
            1, // Minimal fee rate
            0, // sigops_rate (unused by current selectUTXOsLogic)
            1, // rbfBuffer (unused by current selectUTXOsLogic)
            { filterStampUTXOs: true, includeAncestors: false }, // ensure stamp UTXOs are filtered
          );
          utxos = result.inputs; // selectUTXOsForTransaction returns { inputs: UTXO[], ... }
          logger.info("api-utxo-query", {
            message: "API: Fetched filtered UTXOs",
            address,
            count: utxos.length,
          });
        } catch (error) {
          logger.error("api-utxo-query", {
            message: "API: Error selecting/filtering UTXOs",
            address,
            error: (error as Error).message,
          });
          return ResponseUtil.internalError(
            error as Error,
            "Failed to select/filter UTXOs",
          );
        }
      } else {
        // Use getAddressUTXOs for getting all (potentially unfiltered) UTXOs
        // This method within UTXOService now uses CommonUTXOService
        try {
          utxos = await utxoService.getAddressUTXOs(address, {
            filterStampUTXOs: false, // Explicitly false for this branch
            includeAncestors: false, // Typically not needed for a simple balance query
          });
          logger.info("api-utxo-query", {
            message: "API: Fetched all UTXOs",
            address,
            count: utxos.length,
          });
        } catch (error) {
          logger.error("api-utxo-query", {
            message: "API: Error fetching all UTXOs",
            address,
            error: (error as Error).message,
          });
          return ResponseUtil.internalError(
            error as Error,
            "Failed to fetch UTXOs",
          );
        }
      }

      if (!utxos) { // Should generally not happen if errors are caught, but as a safeguard
        logger.warn("api-utxo-query", {
          message:
            "API: No UTXOs found or error occurred, utxos array is undefined",
          address,
        });
        return ResponseUtil.notFound(
          "No UTXOs found for address or error in processing",
        );
      }

      // Sorting remains the same
      const sortedUtxos: UTXO[] = [...utxos].sort((a, b) => a.value - b.value);
      logger.debug("api-utxo-query", {
        message: "API: Successfully processed UTXO query",
        address,
        finalCount: sortedUtxos.length,
      });

      return new Response(JSON.stringify({ utxos: sortedUtxos }), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      logger.error("api-utxo-query", {
        message: "API: Unhandled error in UTXO query handler",
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      return ResponseUtil.internalError(
        error as Error,
        "Internal Server Error",
      );
    }
  },
};
