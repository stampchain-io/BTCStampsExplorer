/* ===== SHARED LAZY LOWEST-PRICE-DISPENSER HOOK ===== */
import { IS_BROWSER } from "$fresh/runtime.ts";
import { fetchLowestPriceOpenDispenser } from "$lib/utils/api/dispensers/fetchLowestPriceDispenser.ts";
import type { DispenserRow } from "$types/stamp.d.ts";
import type { RefObject } from "preact";
import { useEffect, useState } from "preact/hooks";

// Per stampchain.io#1209 / btc_stamps#939: marketplace/listing responses
// only ever attach aggregated market data (floor price, dispenser counts)
// to a stamp, never a concrete dispenser to buy from — bulk server-side
// fetching was explicitly rejected (no Counterparty batch endpoint; would
// blow the marketplace route's 15s timeout and risk 429s). This hook is the
// single place that fetches the live dispenser on demand, once a listing
// scrolls into view, shared by both StampListingsRow and StampCard so the
// fetch/cache logic isn't duplicated across the grid and table views.
//
// Once btc_stamps#939 ships (indexer starts populating
// stamp_market_data.lowest_dispenser_*), StampService.enrichStampWithMarketData
// attaches the resolved dispenser server-side as `stamp.lowestPriceDispenser`
// (same DispenserRow-compatible snake_case shape as this hook returns) — see
// step 1 below, which makes every call site of this hook go inert
// automatically the moment that data is present, with no caller changes.

const CACHE_TTL_MS = 45_000; // Display data can tolerate a fairly long TTL.
const STALE_RECHECK_MS = 12_000; // Purchase flow should not trust a cache hit older than this.

interface CacheEntry {
  dispenser: DispenserRow | null;
  fetchedAt: number;
}

const dispenserCache = new Map<string, CacheEntry>();
const inFlightRequests = new Map<string, Promise<DispenserRow | null>>();

function isFresh(entry: CacheEntry | undefined, maxAgeMs: number): boolean {
  return !!entry && Date.now() - entry.fetchedAt < maxAgeMs;
}

function fetchAndCache(cpid: string): Promise<DispenserRow | null> {
  const inFlight = inFlightRequests.get(cpid);
  if (inFlight) return inFlight;

  const promise = fetchLowestPriceOpenDispenser(cpid)
    .then((dispenser) => {
      dispenserCache.set(cpid, { dispenser, fetchedAt: Date.now() });
      return dispenser;
    })
    .finally(() => {
      inFlightRequests.delete(cpid);
    });

  inFlightRequests.set(cpid, promise);
  return promise;
}

interface StampForDispenserLookup {
  cpid: string;
  lowestPriceDispenser?: DispenserRow | null;
}

interface UseLowestPriceDispenserResult {
  dispenser: DispenserRow | null;
  isLoading: boolean;
}

/**
 * Lazily resolves the lowest-priced open dispenser for a stamp, fetching
 * only once the given element scrolls into view, with a shared TTL cache
 * and in-flight de-dupe across the whole page session (survives grid<->table
 * view toggles and re-mounts, so switching views doesn't re-fetch stamps
 * already resolved).
 *
 * @param stamp - Must include `cpid`. If `lowestPriceDispenser` is already
 * present (server-provided, see btc_stamps#939 above), it's returned
 * immediately — no observer, no fetch, no cache lookup at all.
 * @param elementRef - Ref to the row/card root element to observe.
 */
export function useLowestPriceDispenser(
  stamp: StampForDispenserLookup | null | undefined,
  elementRef: RefObject<Element>,
): UseLowestPriceDispenserResult {
  const serverProvided = stamp?.lowestPriceDispenser ?? null;
  const cpid = stamp?.cpid;

  const [dispenser, setDispenser] = useState<DispenserRow | null>(() => {
    if (serverProvided) return serverProvided;
    if (!cpid) return null;
    const cached = dispenserCache.get(cpid);
    return isFresh(cached, CACHE_TTL_MS) ? cached!.dispenser : null;
  });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (serverProvided) return;
    if (!IS_BROWSER || !cpid) return;
    if (typeof IntersectionObserver === "undefined") return;

    const cached = dispenserCache.get(cpid);
    if (isFresh(cached, CACHE_TTL_MS)) {
      setDispenser(cached!.dispenser);
      return;
    }

    const element = elementRef.current;
    if (!element) return;

    let cancelled = false;
    let hasFetched = false;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting && !hasFetched) {
            hasFetched = true;
            setIsLoading(true);
            fetchAndCache(cpid).then((result) => {
              if (!cancelled) {
                setDispenser(result);
                setIsLoading(false);
              }
            });
            observer.disconnect();
          }
        }
      },
      { rootMargin: "50px", threshold: 0.1 },
    );

    observer.observe(element);

    return () => {
      cancelled = true;
      observer.disconnect();
    };
    // elementRef is a stable ref object (identity doesn't change across
    // renders), so it's intentionally omitted from the dependency array.
  }, [cpid, serverProvided]);

  return { dispenser: serverProvided ?? dispenser, isLoading };
}

/**
 * For BUY-click flows only: constructing a real spend transaction shouldn't
 * trust a potentially-sold-out cached dispenser past a short staleness
 * window, even though the display hook above can tolerate the full TTL.
 * Returns the server-provided dispenser immediately if present, otherwise
 * re-fetches when the cached entry is older than ~12s.
 */
export function getFreshDispenserForPurchase(
  stamp: StampForDispenserLookup | null | undefined,
): Promise<DispenserRow | null> {
  const serverProvided = stamp?.lowestPriceDispenser ?? null;
  if (serverProvided) return Promise.resolve(serverProvided);

  const cpid = stamp?.cpid;
  if (!cpid) return Promise.resolve(null);

  const cached = dispenserCache.get(cpid);
  if (isFresh(cached, STALE_RECHECK_MS)) {
    return Promise.resolve(cached!.dispenser);
  }

  return fetchAndCache(cpid);
}
