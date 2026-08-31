/* ===== FETCH LOWEST-PRICE OPEN DISPENSER (CLIENT-SIDE) ===== */
import type { DispenserRow } from "$types/stamp.d.ts";

// Marketplace/listing API responses only attach aggregated market data
// (floor price, dispenser counts) to each stamp — never a concrete
// dispenser to buy from (see StampCard.tsx / StampListings.tsx buy flow).
// Fetching all cpids' dispensers server-side for every listing page would
// mean one outbound Counterparty call per stamp on every page load, so
// instead we fetch the live dispenser on demand, right when a user clicks
// BUY, reusing the same per-cpid endpoint the stamp detail page
// (StampInfo.tsx) and DonateCta.tsx already call client-side.
const DISPENSER_FETCH_LIMIT = 50;

/**
 * Fetches open dispensers for a cpid and returns the one with the lowest
 * `satoshirate`, mirroring `findLowestPriceDispenser` in
 * `routes/stamp/[id].tsx` and the sort in `StampListingsOpenTable`.
 *
 * Returns `null` if the stamp has no open dispensers (e.g. it sold out or
 * was closed after the listing page was rendered).
 */
export async function fetchLowestPriceOpenDispenser(
  cpid: string,
): Promise<DispenserRow | null> {
  try {
    const params = new URLSearchParams({
      limit: DISPENSER_FETCH_LIMIT.toString(),
    });
    const response = await fetch(
      `/api/v2/stamps/${encodeURIComponent(cpid)}/dispensers?${params}`,
    );

    if (!response.ok) {
      // 404 is the expected response when a stamp has no dispensers at all.
      return null;
    }

    const body = await response.json();
    const dispensers: DispenserRow[] = Array.isArray(body?.data)
      ? body.data
      : [];

    return dispensers
      .filter((d) => d.status === "open" && d.give_remaining > 0)
      .reduce<DispenserRow | null>(
        (lowest, dispenser) =>
          !lowest || dispenser.satoshirate < lowest.satoshirate
            ? dispenser
            : lowest,
        null,
      );
  } catch (error) {
    console.error(
      "[fetchLowestPriceOpenDispenser] Failed to fetch dispensers:",
      error,
    );
    return null;
  }
}
