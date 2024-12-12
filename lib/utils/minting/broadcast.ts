// lib/utils/minting/broadcast.ts
import { Psbt } from "bitcoinjs-lib";
import { logger } from "$lib/utils/logger.ts";

interface BroadcastResponse {
  txid?: string;
  error?: string;
}

const BROADCAST_ENDPOINTS = [
  "https://mempool.space/api/tx",
  "https://blockstream.info/api/tx",
  "https://api.blockcypher.com/v1/btc/main/txs/push",
] as const;

export async function broadcastTransaction(
  signedPsbtHex: string,
): Promise<string> {
  // Convert PSBT to raw transaction
  let rawTxHex: string;
  try {
    const psbt = Psbt.fromHex(signedPsbtHex);

    // Validate that the PSBT is signed
    if (!psbt.validateSignaturesOfAllInputs(() => true)) {
      throw new Error("PSBT is not fully signed");
    }

    // Finalize and extract
    psbt.finalizeAllInputs();
    rawTxHex = psbt.extractTransaction().toHex();

    logger.debug("broadcast", {
      message: "Converted PSBT to raw transaction",
      data: { rawTxLength: rawTxHex.length },
    });
  } catch (error) {
    logger.error("broadcast", {
      message: "Failed to convert PSBT to raw transaction",
      error,
    });
    throw new Error(`Failed to convert PSBT: ${error.message}`);
  }

  let lastError: Error | null = null;

  for (const endpoint of BROADCAST_ENDPOINTS) {
    try {
      logger.debug("broadcast", {
        message: `Attempting to broadcast via ${endpoint}`,
        data: { endpoint },
      });

      const payload = endpoint.includes("blockcypher")
        ? JSON.stringify({ tx: rawTxHex })
        : rawTxHex;

      const response = await fetch(endpoint, {
        method: "POST",
        headers: {
          "Content-Type": endpoint.includes("blockcypher")
            ? "application/json"
            : "text/plain",
        },
        body: payload,
      });

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Broadcasting failed: ${error}`);
      }

      let txid: string;
      if (endpoint.includes("blockcypher")) {
        const json = await response.json();
        txid = json.tx.hash;
      } else {
        txid = await response.text();
      }

      logger.debug("broadcast", {
        message: "Transaction broadcast successful",
        data: { endpoint, txid },
      });

      return txid;
    } catch (error) {
      logger.error("broadcast", {
        message: `Broadcast attempt failed for ${endpoint}`,
        error,
      });
      lastError = error;
      continue;
    }
  }

  const errorMessage = `All broadcast attempts failed. Last error: ${
    lastError?.message || "Unknown error"
  }`;
  logger.error("broadcast", {
    message: errorMessage,
    error: lastError,
  });
  throw new Error(errorMessage);
}
