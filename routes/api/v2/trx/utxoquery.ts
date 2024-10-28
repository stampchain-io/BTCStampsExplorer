import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import type { UTXO } from "$lib/types/index.d.ts";

// NOTE: this fetches all UTXOs without consideringa of assets bount to UTXO
// see selectUTXOsForTransaction for querying with filtering out XCP UTXO bount assets

export const handler: Handlers = {
  async GET(req: Request) {
    try {
      const url = new URL(req.url);
      const address = url.searchParams.get("address");

      if (!address) {
        return ResponseUtil.error("Address parameter is required", 400);
      }

      console.log("Fetching UTXOs for address:", address);
      const result = await getUTXOForAddress(address);
      console.log("Raw result from getUTXOForAddress:", result);

      if (!result) {
        console.log("No UTXOs found");
        return ResponseUtil.error("No UTXOs found for address", 404);
      }

      const utxos: UTXO[] = Array.isArray(result) ? result : [result];
      console.log(`Found ${utxos.length} UTXOs`);

      const sortedUtxos: UTXO[] = [...utxos].sort((a, b) => a.value - b.value);
      console.log(`Sorted ${sortedUtxos.length} UTXOs`);
      console.log("First two UTXOs:", sortedUtxos.slice(0, 2));

      const response: { utxos: UTXO[] } = { utxos: sortedUtxos };
      console.log("Final response structure:", {
        hasUtxos: !!response.utxos,
        utxosLength: response.utxos.length,
        isArray: Array.isArray(response.utxos),
        sampleSize: Math.min(2, response.utxos.length),
        sample: response.utxos.slice(0, 2),
      });

      return new Response(JSON.stringify(response), {
        headers: { "Content-Type": "application/json" },
      });
    } catch (error) {
      console.error("Error in UTXO query handler:", error);
      return ResponseUtil.error(
        error instanceof Error ? error.message : "Internal Server Error",
        500,
      );
    }
  },
};
