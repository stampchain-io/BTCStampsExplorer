import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { UTXOService } from "$server/services/transaction/utxoService.ts";
import { logger } from "$lib/utils/logger.ts";
import type { AncestorInfo, UTXO } from "$types/index.d.ts";

export const handler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      const { address } = ctx.params;
      if (!address) {
        return ResponseUtil.badRequest("Address is required");
      }

      // Use existing UTXOService with ancestor information
      const utxos = await UTXOService.getAddressUTXOs(address, {
        includeAncestors: true,
        filterStampUTXOs: true,
      });

      // Extract ancestor information from UTXOs
      const ancestors: AncestorInfo[] = utxos
        .filter((utxo: UTXO) => utxo.ancestorCount && utxo.ancestorCount > 0)
        .map((utxo: UTXO) => ({
          fees: utxo.ancestorFees || 0,
          vsize: utxo.ancestorSize || 0,
          weight: (utxo.ancestorSize || 0) * 4,
        }));

      logger.debug("stamps", {
        message: "UTXO ancestors fetched",
        address,
        ancestorCount: ancestors.length,
      });

      return ResponseUtil.success({ ancestors });
    } catch (error) {
      logger.error("stamps", {
        message: "Error fetching UTXO ancestors",
        error: error instanceof Error ? error.message : String(error),
      });
      return ResponseUtil.internalError(error);
    }
  },
};
