import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { BitcoinUtxoManager } from "$server/services/transaction/bitcoinUtxoManager.ts";
import type { BasicUTXO, UTXO } from "$types/index.d.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

/**
 * Internal UTXO Query Endpoint
 *
 * Fetches UTXOs for a given Bitcoin address with optional filtering.
 *
 * Query Parameters:
 * - address (required): Bitcoin address to query UTXOs for
 * - excludeAssets (legacy): "true" to exclude stamp-bearing UTXOs, "false" for all UTXOs
 * - spendableOnly (preferred): "true" to return only spendable UTXOs, "false" for all UTXOs
 *
 * Filtering Behavior:
 * - When filtering is enabled (excludeAssets=true OR spendableOnly=true):
 *   Returns UTXOs that do NOT contain stamps/assets (spendable for transactions)
 * - When filtering is disabled (both parameters false or omitted):
 *   Returns ALL UTXOs including those that contain stamps/assets
 *
 * Note: Filtering depends on stamp balance data having valid UTXO references.
 * If stamp balances have empty UTXO fields, filtering may not exclude expected UTXOs.
 *
 * Response Format:
 * {
 *   "success": true,
 *   "data": {
 *     "utxos": [
 *       {
 *         "txid": "string",
 *         "vout": number,
 *         "value": number,
 *         "confirmations": number
 *       }
 *     ]
 *   }
 * }
 */
export const handler: Handlers = {
  async GET(req: Request) {
    // Security check for internal endpoints
    const originError = InternalApiFrontendGuard.requireInternalAccess(req);
    if (originError) return originError;

    const utxoService = new BitcoinUtxoManager();
    try {
      const url = new URL(req.url);
      const address = url.searchParams.get("address");

      // 🎯 IMPROVED NAMING: Support both old and new parameter names
      const excludeAssets = url.searchParams.get("excludeAssets") === "true"; // Legacy support
      const spendableOnly = url.searchParams.get("spendableOnly") === "true"; // New descriptive name
      const filterStampBearingUTXOs = excludeAssets || spendableOnly; // Use either parameter

      if (!address) {
        return ApiResponseUtil.badRequest("address parameter is required");
      }

      logger.debug("api", {
        message: "Internal UTXO query request received",
        address,
        excludeAssets, // Legacy parameter
        spendableOnly, // New parameter
        filterStampBearingUTXOs, // Final decision
      });

      let utxos: BasicUTXO[] | UTXO[];

      if (filterStampBearingUTXOs) {
        // ✅ FIXED: Use getAddressUTXOs for listing spendable UTXOs only
        try {
          utxos = await utxoService.getAddressUTXOs(address, {
            filterStampUTXOs: true, // Filter OUT stamp-bearing UTXOs = return spendable only
            includeAncestors: false, // No ancestors needed for listing
          });
          logger.info("api", {
            message:
              "Internal API: Fetched spendable UTXOs only (filtered out stamp-bearing UTXOs)",
            address,
            count: utxos.length,
          });
        } catch (error) {
          logger.error("api", {
            message: "Internal API: Error fetching spendable UTXOs",
            address,
            error: (error as Error).message,
          });
          return ApiResponseUtil.internalError(
            error as Error,
            "Failed to fetch spendable UTXOs",
          );
        }
      } else {
        // Use getAddressUTXOs for getting all UTXOs (including stamp-bearing ones)
        try {
          utxos = await utxoService.getAddressUTXOs(address, {
            filterStampUTXOs: false, // Include ALL UTXOs (spendable + stamp-bearing)
            includeAncestors: false, // No ancestors needed for listing
          });
          logger.info("api", {
            message:
              "Internal API: Fetched all UTXOs (including stamp-bearing)",
            address,
            count: utxos.length,
          });
        } catch (error) {
          logger.error("api", {
            message: "Internal API: Error fetching all UTXOs",
            address,
            error: (error as Error).message,
          });
          return ApiResponseUtil.internalError(
            error as Error,
            "Failed to fetch UTXOs",
          );
        }
      }

      if (!utxos || utxos.length === 0) {
        logger.warn("api", {
          message: "Internal API: No UTXOs found",
          address,
        });
        return ApiResponseUtil.notFound(
          "No UTXOs found for address",
        );
      }

      // Sort UTXOs by value (ascending) for consistent ordering
      const sortedUtxos = [...utxos].sort((a, b) => a.value - b.value);

      logger.debug("api", {
        message: "Internal API: Successfully processed UTXO query",
        address,
        finalCount: sortedUtxos.length,
        totalValue: sortedUtxos.reduce((sum, utxo) => sum + utxo.value, 0),
      });

      return ApiResponseUtil.success({ utxos: sortedUtxos });
    } catch (error) {
      logger.error("api", {
        message: "Internal API: Unhandled error in UTXO query handler",
        error: (error as Error).message,
        stack: (error as Error).stack,
      });
      return ApiResponseUtil.internalError(
        error as Error,
        "Internal Server Error",
      );
    }
  },
};
