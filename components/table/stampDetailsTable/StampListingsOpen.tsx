/* ===== STAMP LISTINGS OPEN TABLE COMPONENT ===== */
import { colGroup } from "$components/layout/types.ts";
import {
  cellCenterL2Detail,
  cellLeftL2Detail,
  cellRightL2Detail,
  container2,
  ScrollContainer,
  shadowGlowPurple,
} from "$layout";
import {
  formatNumber,
  formatSatoshisToBTC,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { labelXxs, textXs } from "$text";
import type { StampListingsOpenProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function StampListingsOpenTable({
  dispensers,
  onSelectDispenser,
  selectedDispenser,
}: StampListingsOpenProps) {
  /* ===== CONSTANTS ===== */
  const headers = ["PRICE", "ESCROW", "GIVE", "REMAIN", "SOURCE"];

  /* ===== DATA PROCESSING ===== */
  const sortedDispensers = [...(dispensers || [])]
    .filter((dispenser) => dispenser.give_remaining > 0)
    .sort((a, b) => b.give_remaining - a.give_remaining);

  // Mirrors StampInfo's displayPrice fallback (selectedDispenser -> lowest
  // priced open dispenser) so the highlighted row always matches the price
  // shown there, instead of comparing against the separately-sourced,
  // potentially stale market floor price.
  const lowestPriceDispenser = sortedDispensers.reduce<
    typeof sortedDispensers[number] | null
  >(
    (lowest, dispenser) =>
      !lowest || dispenser.satoshirate < lowest.satoshirate
        ? dispenser
        : lowest,
    null,
  );

  /* ===== RENDER ===== */
  return (
    <div class="relative w-full">
      <ScrollContainer class="min-h-[76px] max-h-[244px] scrollbar-background-layer1">
        <div class="!-my-2 overflow-x-auto tablet:overflow-x-visible scrollbar-hide">
          <table class={`w-full border-separate border-spacing-y-2 ${textXs}`}>
            {/* ===== TABLE STRUCTURE ===== */}
            <colgroup>
              {colGroup([
                { width: "min-w-[110px] w-auto" }, // PRICE
                { width: "min-w-[55px] w-auto" }, // ESCROW
                { width: "min-w-[55px] w-auto" }, // GIVE
                { width: "min-w-[55px] w-auto" }, // REMAIN
                { width: "min-w-[95px] w-auto" }, // SOURCE
              ]).map((col) => <col key={col.key} class={col.className} />)}
            </colgroup>
            {/* ===== TABLE HEADER ===== */}
            <thead class="sticky top-0 z-10">
              {/* Only sticky on desktop */}
              <tr class={container2}>
                {headers.map((header, i) => {
                  const isFirst = i === 0;
                  const isLast = i === (headers?.length ?? 0) - 1;
                  const rowClass = isFirst
                    ? cellLeftL2Detail
                    : isLast
                    ? cellRightL2Detail
                    : cellCenterL2Detail;

                  return (
                    <th
                      key={header}
                      class={`!py-1.5 !px-3 ${rowClass} ${labelXxs} text-color-neutral-500`}
                    >
                      {header}
                    </th>
                  );
                })}
              </tr>
            </thead>
            {/* ===== TABLE CONTENT ===== */}
            <tbody>
              {sortedDispensers.map((dispenser) => {
                const isEmpty = dispenser.give_remaining === 0;
                const isLowestPrice =
                  dispenser.source === lowestPriceDispenser?.source;
                const isSelected =
                  selectedDispenser?.source === dispenser.source ||
                  (!selectedDispenser && isLowestPrice);

                return (
                  <tr
                    key={dispenser.source}
                    class={`${container2} ${shadowGlowPurple} cursor-pointer ${
                      isEmpty ? "text-color-neutral-500" : ""
                    } ${
                      isSelected
                        ? "text-color-neutral-200"
                        : "text-color-neutral-500"
                    }`}
                    onClick={() => onSelectDispenser?.(dispenser)}
                  >
                    {/* PRICE */}
                    <td
                      class={`${cellLeftL2Detail} text-color-orange-400 group-hover:text-color-hover`}
                    >
                      {formatSatoshisToBTC(dispenser.satoshirate, {
                        includeSymbol: true,
                        decimals: 8,
                        stripZeros: true,
                      })}
                    </td>
                    {/* ESCROW */}
                    <td
                      class={cellCenterL2Detail}
                    >
                      {formatNumber(dispenser.escrow_quantity, 0)}
                    </td>
                    {/* GIVE */}
                    <td
                      class={cellCenterL2Detail}
                    >
                      {formatNumber(dispenser.give_quantity, 0)}
                    </td>
                    {/* REMAIN */}
                    <td
                      class={`${cellCenterL2Detail} text-color-neutral-200`}
                    >
                      {formatNumber(dispenser.give_remaining, 0)}
                    </td>
                    {/* SOURCE */}
                    <td
                      class={`${cellRightL2Detail} group-hover:text-color-neutral-200`}
                    >
                      DISPENSER
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
