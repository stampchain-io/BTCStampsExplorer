import { Handlers } from "$fresh/server.ts";
import type { UTXOData } from "$lib/types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { BitcoinUtxoManager } from "$server/services/transaction/bitcoinUtxoManager.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    const { address } = ctx.params;

    try {
      logger.info(`Getting UTXO ancestors for address: ${address}`);

      // Get UTXOs with ancestor information
      const utxoService = new BitcoinUtxoManager();
      const utxos = await utxoService.getAddressUTXOs(address, {
        includeAncestors: true,
        filterStampUTXOs: true,
      });

      // Extract ancestor information from UTXOs
      const ancestors: UTXOData[] = utxos
        .filter((utxo: UTXOData) =>
          utxo.ancestorCount && utxo.ancestorCount > 0
        )
        .map((utxo: UTXOData) => ({
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
