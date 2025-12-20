import type { StampRow } from "$types/stamp.d.ts";

/**
 * Stamp Display Overrides (UI / API response shaping)
 * -----------------------------------------------------------------------------
 * Purpose:
 * - Provide a *narrow*, explicit mechanism to override certain display-only
 *   fields for *specific* stamps without changing the underlying on-chain data.
 *
 * Why this exists:
 * - Creator "names" are normally derived from wallet ownership / creators table
 *   (see CreatorService / StampService). In some cases we intentionally need a
 *   per-stamp "artist" display name that differs from the wallet-derived name.
 *
 * Guardrails / philosophy:
 * - This MUST NOT change `stamp.creator` (the actual address).
 * - This is NOT a general "metadata editing" feature; keep entries rare and
 *   heavily commented so future maintainers can audit intent and provenance.
 * - These overrides are applied opportunistically in web routes and API handlers
 *   that return `StampRow` objects.
 *
 * Historical note:
 * - 2025-12: Added a one-off override to display creator name "ZED" for a single
 *   stamp whose on-chain creator wallet correctly maps to "ARWYN", but needs a
 *   display override for the stamp detail page and API consumers.
 */

/**
 * Map of stamp identifiers to overridden creator display name.
 *
 * Identifiers:
 * - We support multiple identifiers because stamps can be addressed by:
 *   - route param id (may be tx hash, stamp hash, or other identifier)
 *   - `cpid`
 *   - `tx_hash`
 *   - `stamp_hash`
 *   - `file_hash`
 *   - `stamp` number (stringified)
 *
 * Keeping this as a Map makes lookup O(1) and avoids accidental partial matches.
 */
const CREATOR_NAME_OVERRIDE_BY_IDENTIFIER = new Map<string, string>([
  /**
   * Display override request:
   * - Route: `/stamp/4bd03424dd35f2fe1fb319110a3dd28f971e5e59d1ed5004f6b2`
   * - Desired display: "ZED"
   *
   * IMPORTANT:
   * - This key is the exact identifier used in the URL.
   * - We also check other canonical fields (tx_hash, stamp_hash, file_hash, cpid)
   *   at runtime so the override still applies if the user navigates via a
   *   different identifier.
   */
  ["4bd03424dd35f2fe1fb319110a3dd28f971e5e59d1ed5004f6b2", "ZED"],
]);

/**
 * Apply display-only overrides to a single stamp row.
 *
 * @param stamp - Stamp row as returned from repository/service/controller
 * @param requestIdentifier - Optional route/api identifier used to fetch stamp
 * @returns StampRow (same object shape) with overrides applied
 */
export function applyStampDisplayOverrides(
  stamp: StampRow,
  requestIdentifier?: string,
): StampRow {
  // Collect candidate identifiers (ordered from most specific/contextual).
  // NOTE: Avoid `filter(Boolean)` here to keep TypeScript narrowing strict.
  const candidates: string[] = [];

  if (requestIdentifier) candidates.push(requestIdentifier);
  if (stamp.cpid) candidates.push(stamp.cpid);
  if (stamp.tx_hash) candidates.push(stamp.tx_hash);
  if (stamp.stamp_hash) candidates.push(stamp.stamp_hash);
  if (stamp.file_hash) candidates.push(stamp.file_hash);
  if (stamp.stamp !== null) candidates.push(String(stamp.stamp));

  for (const key of candidates) {
    const overrideCreatorName = CREATOR_NAME_OVERRIDE_BY_IDENTIFIER.get(key);
    if (overrideCreatorName) {
      return {
        ...stamp,
        // NOTE: We override `creator_name` only; the wallet address remains true.
        creator_name: overrideCreatorName,
      };
    }
  }

  return stamp;
}

