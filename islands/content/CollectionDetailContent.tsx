/* ===== COLLECTION DETAIL CONTENT COMPONENT ===== */
import { SelectorButtons } from "$button";
import { StampCard } from "$card";
import { SortButton } from "$islands/button/SortButton.tsx";
import { container2Icon, containerPillCount, EmptyState } from "$layout";
import {
  getCurrentPathname,
  safeNavigate,
} from "$lib/utils/navigation/freshNavigationUtils.ts";
import { formatNumberWithCommas } from "$lib/utils/ui/formatting/formatUtils.ts";
import { subtitlePrimary } from "$text";
import type { StampRow } from "$types/stamp.d.ts";
import { useCallback } from "preact/hooks";

/* ===== COMPONENT ===== */
export const CollectionDetailContent = (
  {
    stamps = [],
    market = "all",
    sortBy = "DESC",
    totalStamps = null,
    totalEditions = null,
    listedStamps = null,
  }: {
    stamps: StampRow[];
    market?: "all" | "listings";
    sortBy?: "ASC" | "DESC";
    totalStamps?: number | null;
    totalEditions?: number | null;
    listedStamps?: number | null;
  },
) => {
  const stampsValue = totalStamps !== null
    ? formatNumberWithCommas(totalStamps)
    : "N/A";
  const editionsValue = totalEditions !== null
    ? formatNumberWithCommas(totalEditions)
    : "N/A";
  const countPill = market === "listings"
    ? (
      <>
        {listedStamps !== null ? formatNumberWithCommas(listedStamps) : "N/A"}
        <span class="ml-1.5 text-color-neutral-600">LISTINGS</span>
      </>
    )
    : totalStamps !== totalEditions
    ? (
      <>
        {stampsValue}
        <span class="ml-1.5 text-color-neutral-600">/ {editionsValue}</span>
      </>
    )
    : (
      <>
        {stampsValue}
        <span class="ml-1.5 text-color-neutral-600">STAMPS</span>
      </>
    );

  /* ===== EVENT HANDLERS ===== */
  // Same "market=listings" filter as /marketplace - re-navigates through the
  // Fresh partial on this route so the server re-fetches only listed stamps
  const handleMarketChange = useCallback((value: string) => {
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return;
    }

    const params = new URLSearchParams(globalThis.location.search);
    if (value === "listings") {
      params.set("market", "listings");
    } else {
      params.delete("market");
    }
    params.set("page", "1");

    const queryString = params.toString();
    safeNavigate(
      getCurrentPathname() + (queryString ? `?${queryString}` : ""),
    );
  }, []);

  return (
    <div data-name="stamps" class="relative">
      <div
        class={`absolute -top-2 right-0 ${containerPillCount}`}
      >
        {countPill}
      </div>

      <div class={`flex ${subtitlePrimary} -mt-2`}>
        COLLECTION
      </div>

      <div class="flex items-center justify-between mb-4">
        <SelectorButtons
          options={[
            { value: "all", label: "ALL" },
            { value: "listings", label: "LISTINGS" },
          ]}
          value={market}
          onChange={handleMarketChange}
          size="xsR"
          color="primary"
        />
        <div class={container2Icon}>
          <SortButton initSort={sortBy} />
        </div>
      </div>

      {stamps.length
        ? (
          <div class="grid grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6 gap-5">
            {stamps.map((stamp: StampRow) => (
              <StampCard
                key={stamp.tx_hash}
                stamp={stamp}
              />
            ))}
          </div>
        )
        : (
          <EmptyState
            label={market === "listings"
              ? "NO LISTINGS TO DISPLAY"
              : "UNABLE TO LOAD THE COLLECTION"}
            icon="artStamps"
          />
        )}
    </div>
  );
};
