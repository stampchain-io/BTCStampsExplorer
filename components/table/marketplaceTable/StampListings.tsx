/* ===== MARKETPLACE LISTINGS TABLE COMPONENT ===== */
import { Button } from "$button";
import { ActivityLevelIndicator } from "$components/indicators/ActivityLevelIndicator.tsx";
import { colGroup } from "$components/layout/types.ts";
import { PlaceholderImage } from "$icon";
import BuyStampModal from "$islands/modal/BuyStampModal.tsx";
import { openModal } from "$islands/modal/states.ts";
import {
  cellCenterL2Card,
  cellLeftL2Card,
  cellRightL2Card,
  cellStickyLeft,
  cellStickyLeft2,
  container2,
  shadowGlowPurple,
} from "$layout";
import {
  isBrowser,
  safeNavigate,
} from "$lib/utils/navigation/freshNavigationUtils.ts";
import {
  abbreviateAddress,
  formatBTCAmount,
  formatSupplyValue,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/ui/media/imageUtils.ts";
import { cardRowStampNumber, labelXxs, textXs, valueDarkSm } from "$text";
import type { StampRow } from "$types/stamp.d.ts";
import { useState } from "preact/hooks";

/* ===== CONSTANTS ===== */
const HEADERS = [
  "IMAGE",
  "STAMP #",
  "CPID",
  "ARTIST",
  "LISTED",
  "PRICE",
  "ACTIVITY",
  "DISPENSER",
  "SELLER",
  "BUY",
];

/* ===== HELPERS ===== */
function formatPrice(floorPrice: number | "priceless" | undefined): string {
  if (!floorPrice || floorPrice === "priceless") return "PRICELESS";
  return formatBTCAmount(floorPrice, { includeSymbol: true, decimals: 8 });
}

function getDispenser(stamp: StampRow): {
  txHash: string | null;
  source: string | null;
  origin: string | null;
  giveRemaining: number | null;
  raw: Record<string, unknown> | null;
} {
  const d = (stamp as unknown as Record<string, unknown>).lowestPriceDispenser;
  if (!d || typeof d !== "object") {
    return {
      txHash: null,
      source: null,
      origin: null,
      giveRemaining: null,
      raw: null,
    };
  }
  const dispenser = d as Record<string, unknown>;
  return {
    txHash: typeof dispenser.tx_hash === "string" ? dispenser.tx_hash : null,
    source: typeof dispenser.source === "string" ? dispenser.source : null,
    origin: typeof dispenser.origin === "string" ? dispenser.origin : null,
    giveRemaining: typeof dispenser.give_remaining === "number"
      ? dispenser.give_remaining
      : null,
    // Raw dispenser object (satoshirate, give_quantity, etc.) needed by BuyStampModal
    raw: dispenser,
  };
}

/* ===== ROW COMPONENT ===== */
interface StampListingsRowProps {
  stamp: StampRow;
}

export function StampListingsRow({ stamp }: StampListingsRowProps) {
  const imgSrc = getStampImageSrc(stamp);
  const href = `/stamp/${stamp.tx_hash}`;
  const dispenser = getDispenser(stamp);
  const [fee, setFee] = useState<number>(0);

  const creatorDisplay = stamp.creator_name
    ? stamp.creator_name
    : abbreviateAddress(stamp.creator, 5);

  const listedDisplay = dispenser.giveRemaining != null
    ? `${dispenser.giveRemaining.toLocaleString()}/${
      formatSupplyValue(stamp.supply ?? 0, stamp.divisible)
    }`
    : formatSupplyValue(stamp.supply ?? 0, stamp.divisible);

  // Opens the Buy modal instead of navigating to the stamp detail page.
  // BuyStampModal handles the "wallet not connected" flow internally
  // (opens Connect Wallet, then re-opens this modal once connected).
  // Falls back to the button's default link navigation if dispenser data
  // is unexpectedly missing.
  const handleBuyClick = (e: MouseEvent) => {
    if (!dispenser.raw) return;
    e.preventDefault();
    e.stopPropagation();
    openModal(
      <BuyStampModal
        stamp={stamp}
        fee={fee}
        handleChangeFee={setFee}
        dispenser={dispenser.raw}
      />,
      "slideUpDown",
    );
  };

  /* ===== RENDER ===== */
  return (
    <tr
      class={`${container2} ${shadowGlowPurple}`}
      onClick={(e) => {
        const target = e.target as HTMLElement;
        if (target.closest("button, a")) return;
        if (!e.ctrlKey && !e.metaKey && e.button !== 1) {
          e.preventDefault();
          if (!isBrowser()) return;
          safeNavigate(href);
        }
      }}
    >
      {/* IMAGE — sticky col 0 */}
      <td
        class={`${cellLeftL2Card} ${cellStickyLeft}`}
      >
        <a
          href={href}
          f-partial={href}
          target="_top"
          class="flex items-center justify-center w-6.5 h-6.5 rounded-xl overflow-hidden"
        >
          {imgSrc
            ? (
              <img
                src={imgSrc}
                alt={`Stamp ${stamp.stamp ?? stamp.cpid ?? ""}`}
                class="w-6.5 h-6.5 object-contain rounded-xl pixelart"
              />
            )
            : <PlaceholderImage variant="no-image" className="!rounded-xl" />}
        </a>
      </td>

      {/* STAMP # — sticky col 1 */}
      <td
        class={`${cellCenterL2Card} ${cellStickyLeft2}`}
      >
        <a
          href={href}
          f-partial={href}
          target="_top"
          class={cardRowStampNumber}
        >
          {stamp.stamp != null
            ? (
              <>
                <span class="font-light">#</span>
                {stamp.stamp}
              </>
            )
            : "N/A"}
        </a>
      </td>

      {/* CPID */}
      <td
        class={`${cellCenterL2Card} font-mono text-color-neutral-400`}
      >
        {stamp.cpid ?? "N/A"}
      </td>

      {/* CREATOR/ARTIST */}
      <td
        class={`${cellCenterL2Card} font-medium text-color-neutral-200`}
      >
        <a
          href={`/wallet/${stamp.creator}`}
          class="link-neutral-200-cell"
        >
          {creatorDisplay}
        </a>
      </td>

      {/* LISTED */}
      <td
        class={`${cellCenterL2Card} text-color-primary-400`}
      >
        {listedDisplay}
      </td>

      {/* PRICE */}
      <td
        class={`${cellCenterL2Card} text-color-secondary-400`}
      >
        {formatPrice(stamp.floorPrice)}
      </td>

      {/* ACTIVITY */}
      <td
        class={`${cellCenterL2Card}`}
      >
        {stamp.activity_level
          ? (
            <ActivityLevelIndicator
              level={stamp.activity_level}
              className="mx-auto"
            />
          )
          : <span class="text-color-neutral-400">N/A</span>}
      </td>

      {/* DISPENSER ADDY */}
      <td
        class={`${cellCenterL2Card} text-color-neutral-200`}
      >
        {dispenser.source
          ? (
            <a
              href={`/wallet/${dispenser.source}`}
              class="link-neutral-200-cell"
            >
              {abbreviateAddress(dispenser.source, 5)}
            </a>
          )
          : "N/A"}
      </td>

      {/* SELLER ADDY */}
      <td
        class={`${cellCenterL2Card} text-color-neutral-200`}
      >
        {(dispenser.origin ?? dispenser.source)
          ? (
            <a
              href={`/wallet/${dispenser.origin ?? dispenser.source}`}
              class="link-neutral-200-cell"
            >
              {abbreviateAddress(
                (dispenser.origin ?? dispenser.source)!,
                5,
              )}
            </a>
          )
          : "N/A"}
      </td>

      {/* BUY */}
      <td
        class={`${cellRightL2Card}`}
      >
        <Button
          variant="outline"
          color="primary"
          size="xxs"
          href={href}
          target="_top"
          class="rounded-xl"
          onClick={handleBuyClick}
        >
          BUY
        </Button>
      </td>
    </tr>
  );
}

/* ===== TABLE WRAPPER ===== */
interface StampListingsTableProps {
  stamps: StampRow[];
}

export function StampListingsTable({ stamps }: StampListingsTableProps) {
  return (
    <div class="overflow-x-auto scrollbar-hide">
      <table
        class={`w-full border-separate border-spacing-y-3 ${textXs}`}
      >
        <colgroup>
          {colGroup([
            { width: "w-10" }, // IMAGE
            { width: "min-w-[100px] w-auto" }, // STAMP #
            { width: "min-w-[170px] w-auto" }, // CPID
            { width: "min-w-[110px] w-auto" }, // ARTIST
            { width: "min-w-[70px] w-auto" }, // LISTED
            { width: "min-w-[110px] w-auto" }, // PRICE
            { width: "min-w-[60px] w-auto" }, // ACTIVITY
            { width: "min-w-[110px] w-auto" }, // DISPENSER ADDY
            { width: "min-w-[110px] w-auto" }, // SELLER ADDY
            { width: "min-w-[50px] w-auto" }, // BUY
          ]).map((col) => <col key={col.key} class={col.className} />)}
        </colgroup>
        <thead>
          <tr class={`${container2}`}>
            {HEADERS.map((header, i) => {
              const isFirst = i === 0;
              const isLast = i === HEADERS.length - 1;
              const stickyClass = isFirst
                ? cellStickyLeft
                : i === 1
                ? cellStickyLeft2
                : "";
              const rowClass = isFirst
                ? cellLeftL2Card
                : isLast
                ? cellRightL2Card
                : cellCenterL2Card;
              return (
                <th
                  key={header}
                  class={`${labelXxs} py-1.5 !px-3 ${rowClass} ${stickyClass} text-color-neutral-500`}
                >
                  {header}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {stamps.length
            ? stamps.map((stamp) => (
              <StampListingsRow
                key={stamp.tx_hash}
                stamp={stamp}
              />
            ))
            : (
              <tr>
                <td
                  colSpan={HEADERS.length}
                  class={`w-full h-[46px] ${container2}`}
                >
                  <h6 class={`${valueDarkSm} text-center`}>
                    NO LISTINGS TO DISPLAY
                  </h6>
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
