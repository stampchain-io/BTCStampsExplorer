import { convertToEmoji } from "utils/util.ts";
import { Src20Detail } from "globals";
import * as crypto from "crypto";

// FIXME: this should be consolidated with the src20MktService.ts

const src20_listing_api = [
  {
    name: "stampscan_listing_summary",
    url: "https://api.stampscan.xyz/market/listingSummary",
  },
];

/**
 * Handles the SRC query by making requests to multiple nodes and returning the first non-null result.
 * @param payload - The payload for the query.
 * @returns The result of the query or null if all node requests fail.
 * TO BE IMPLEMENTED
 */
export const handleSRCListingQuery = async (payload: any) => {
  for (const node of src20_listing_api) {
    const response = await fetch(node.url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });
    const result = await response.json();
    if (result !== null) {
      return result;
    }
  }
  console.error("Todas las consultas a los nodos han fallado.");
  return null;
};

export function formatSRC20Row(row: Src20Detail) {
  return {
    ...row,
    tick: convertToEmoji(row.tick),
    max: row.max ? row.max.toString() : null,
    lim: row.lim ? row.lim.toString() : null,
    amt: row.amt ? row.amt.toString() : null,
  };
}

export function calculateTickHash(tick: string): string {
  const encoder = new TextEncoder();
  const data = encoder.encode(tick.toLowerCase());
  const hashBuffer = crypto.createHash("sha3-256").update(data).digest();
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map((b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
  return hashHex;
}
