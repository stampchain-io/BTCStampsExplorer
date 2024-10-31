import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { TransactionService } from "$server/services/transaction/index.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import type { Output, ScriptType, UTXO } from "$types/index.d.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";

export const handler: Handlers = {
  async GET(req: Request) {
    try {
      const url = new URL(req.url);
      const address = url.searchParams.get("address");
      const includeAncestors =
        url.searchParams.get("includeAncestors") === "true";
      const forTransaction = url.searchParams.get("forTransaction") === "true";
      const type = url.searchParams.get("type");
      const feeRate = url.searchParams.get("feeRate");
      const fileSize = url.searchParams.get("fileSize");

      if (!address) {
        return ResponseUtil.error("Address parameter is required", 400);
      }

      // For transaction fee estimation with actual UTXOs
      if (forTransaction && type && feeRate) {
        try {
          // Prepare outputs based on transaction type
          const outputs: Output[] = [];
          if (type === "stamp" && fileSize) {
            const size = parseInt(fileSize);
            const outputCount = Math.ceil(size / 32);

            // Add P2WSH outputs for stamp data
            for (let i = 0; i < outputCount; i++) {
              const output: Output = {
                script: "", // This will be set by the transaction service
                value: TX_CONSTANTS.DUST_SIZE,
                scriptType: "P2WSH" as ScriptType,
                address: "", // This will be set by the transaction service
              };
              outputs.push(output);
            }

            // Add change output
            const changeOutput: Output = {
              script: "", // This will be set by the transaction service
              value: 0, // Will be calculated by selectUTXOsForTransaction
              scriptType: "P2WPKH" as ScriptType,
              address: address, // Use the sender's address for change
            };
            outputs.push(changeOutput);
          }

          const result = await TransactionService.UTXOService
            .selectUTXOsForTransaction(
              address,
              outputs,
              parseInt(feeRate),
              0, // sigops_rate
              1.5, // rbfBuffer
              {
                filterStampUTXOs: true,
                includeAncestors,
              },
            );

          if (!result || !result.inputs || result.inputs.length === 0) {
            return new Response(
              JSON.stringify({
                utxos: [],
                isEstimate: true,
              }),
              {
                headers: { "Content-Type": "application/json" },
              },
            );
          }

          return new Response(
            JSON.stringify({
              utxos: result.inputs,
              fee: result.fee,
              change: result.change,
              totalInputs: result.inputs.length,
              outputs: outputs,
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        } catch (error) {
          console.error("Error selecting UTXOs:", error);
          return new Response(
            JSON.stringify({
              utxos: [],
              isEstimate: true,
            }),
            {
              headers: { "Content-Type": "application/json" },
            },
          );
        }
      }

      // Original behavior for general UTXO queries
      console.log("Fetching all UTXOs for address:", address);
      const utxos = await getUTXOForAddress(
        address,
        undefined,
        undefined,
        includeAncestors,
      );

      if (!utxos) {
        return ResponseUtil.error("No UTXOs found for address", 404);
      }

      const sortedUtxos = [...utxos].sort((a, b) => a.value - b.value);
      return new Response(JSON.stringify({ utxos: sortedUtxos }), {
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
