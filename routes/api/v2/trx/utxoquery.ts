import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { TransactionService } from "$server/services/transaction/index.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import type { UTXO } from "$types/index.d.ts";

export const handler: Handlers = {
  async GET(req: Request) {
    try {
      const url = new URL(req.url);
      const address = url.searchParams.get("address");
      const excludeAssets = url.searchParams.get("excludeAssets") === "true";

      if (!address) {
        return ResponseUtil.badRequest("Address parameter is required");
      }

      console.log("Fetching UTXOs for address:", address, {
        excludeAssets,
      });

      if (excludeAssets) {
        // Use selectUTXOsForTransaction to get filtered UTXOs
        try {
          const result = await TransactionService.UTXOService
            .selectUTXOsForTransaction(
              address,
              [], // Empty outputs array as we just want available UTXOs
              1, // Minimal fee rate as we're just filtering
              0,
              1,
              { filterStampUTXOs: true, includeAncestors: false },
            );

          return new Response(
            JSON.stringify({
              utxos: result.inputs.sort((a, b) => a.value - b.value),
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error selecting UTXOs:", error);
          return ResponseUtil.internalError(error, "Failed to select UTXOs");
        }
      } else {
        // Original behavior for getting all UTXOs
        const result = await getUTXOForAddress(address);
        console.log("Raw result from getUTXOForAddress:", result);

        if (!result) {
          console.log("No UTXOs found");
          return ResponseUtil.notFound("No UTXOs found for address");
        }

        const utxos: UTXO[] = Array.isArray(result) ? result : [result];
        console.log(`Found ${utxos.length} UTXOs`);

        const sortedUtxos: UTXO[] = [...utxos].sort((a, b) =>
          a.value - b.value
        );
        console.log(`Sorted ${sortedUtxos.length} UTXOs`);

        return new Response(JSON.stringify({ utxos: sortedUtxos }), {
          headers: { "Content-Type": "application/json" },
        });
      }
    } catch (error) {
      console.error("Error in UTXO query handler:", error);
      return ResponseUtil.internalError(error, "Internal Server Error");
    }
  },
};
