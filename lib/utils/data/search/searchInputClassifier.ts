/**
 * Shared search input classifier for both Stamp and SRC-20 searches
 *
 * Classifies user input into typed categories and applies
 * appropriate sanitization per type. Used by:
 * - SearchStampModal (frontend)
 * - SearchSRC20Modal (frontend)
 * - SRC20 QueryService (backend)
 * - Stamp search API (backend)
 *
 * @module searchInputClassifier
 */
import { isTxHash, isValidBitcoinAddress } from "$lib/utils/typeGuards.ts";

export type SearchInputType =
  | "ticker" // SRC-20 only
  | "address" // Both
  | "tx_hash" // Both
  | "cpid" // Stamp only
  | "stamp_number" // Stamp only
  | "unknown";

export interface ClassifiedInput {
  type: SearchInputType;
  sanitized: string;
  original: string;
}

/**
 * Classifies and sanitizes search input for both stamp and SRC-20
 * searches.
 *
 * Priority order matters:
 *   1. CPID (starts with 'A' + digits -- checked before tx_hash
 *      since both can be hex-ish)
 *   2. Stamp number (numeric, possibly negative)
 *   3. Transaction hash (64 hex chars)
 *   4. Bitcoin address (bc1, 1, 3 prefixes)
 *   5. Ticker (1-5 chars after sanitization)
 *   6. Unknown
 */
export function classifySearchInput(
  input: string,
): ClassifiedInput {
  const trimmed: string = input.trim();

  if (!trimmed) {
    return { type: "unknown", sanitized: "", original: input };
  }

  // CPID: starts with 'A' or 'a', followed by 5+ digits (real numeric asset IDs)
  if (/^[Aa]\d{5,}$/.test(trimmed)) {
    return {
      type: "cpid",
      sanitized: trimmed.toUpperCase(),
      original: trimmed,
    };
  }

  // Stamp number: numeric (possibly negative for cursed stamps)
  if (/^-?\d+$/.test(trimmed)) {
    return {
      type: "stamp_number",
      sanitized: trimmed,
      original: trimmed,
    };
  }

  // Partial Bitcoin address (prefix detection for autosuggest)
  // - bc1q / bc1p prefix: unambiguous, classify immediately
  // - 1 or 3 + at least one Base58 letter (pure digits = stamp#)
  if (
    /^bc1[qp]/i.test(trimmed) ||
    (/^[13]/.test(trimmed) && trimmed.length >= 2 &&
      /[a-km-zA-HJ-NP-Z]/.test(trimmed))
  ) {
    return {
      type: "address",
      sanitized: trimmed,
      original: trimmed,
    };
  }

  // Transaction hash: exactly 64 hex characters
  // Use a local copy to avoid type-predicate narrowing to `never`
  const txCandidate: string = trimmed;
  if (isTxHash(txCandidate)) {
    return {
      type: "tx_hash",
      sanitized: txCandidate.toLowerCase(),
      original: trimmed,
    };
  }

  // Partial transaction hash: 8+ hex characters (not yet 64)
  // At 8+ hex chars, very unlikely to be a ticker or other type
  if (/^[a-fA-F0-9]{8,}$/.test(trimmed) && trimmed.length < 64) {
    return {
      type: "tx_hash",
      sanitized: trimmed.toLowerCase(),
      original: trimmed,
    };
  }

  // Bitcoin address (full validation fallback)
  const addrCandidate: string = trimmed;
  if (isValidBitcoinAddress(addrCandidate)) {
    return {
      type: "address",
      sanitized: addrCandidate,
      original: trimmed,
    };
  }

  // SRC-20 Ticker: 1-5 characters after sanitization
  const sanitized: string = trimmed.replace(/[^\w-]/g, "");
  if (sanitized.length >= 1 && sanitized.length <= 5) {
    return {
      type: "ticker",
      sanitized,
      original: trimmed,
    };
  }

  // Fallback -- keep whatever the user typed (trimmed)
  return {
    type: "unknown",
    sanitized: sanitized || trimmed,
    original: trimmed,
  };
}

/**
 * Generate context-aware error messages based on input type
 * and which search modal the user is in.
 */
export function generateSearchErrorMessage(
  input: string,
  searchType: "stamp" | "src20",
): string {
  const { type } = classifySearchInput(input);
  const trimmed = input.trim();

  let header = "NO RESULTS FOUND";
  let detail = "Sorry, can't figure out what you're looking for";

  if (searchType === "stamp") {
    switch (type) {
      case "tx_hash":
        header = "NO STAMP FOUND";
        detail = "No stamp found for this transaction";
        break;
      case "address":
        header = "NO STAMPS FOUND";
        detail = "No stamps found for this address";
        break;
      case "cpid":
        header = "NO STAMP FOUND";
        detail = "The CPID doesn't exist";
        break;
      case "stamp_number":
        header = "NO STAMP FOUND";
        detail = "The stamp number doesn't exist";
        break;
    }
  } else {
    switch (type) {
      case "tx_hash":
        header = "NO TOKEN FOUND";
        detail = "No token deploy found for this transaction";
        break;
      case "address":
        header = "NO TOKENS FOUND";
        detail = "No token deploy found for this address";
        break;
      case "ticker":
        header = "NO TOKEN FOUND";
        detail = "The token ticker isn't recognized";
        break;
    }
  }

  return `${header}\n${trimmed}\n${detail}`;
}
