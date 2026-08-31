/* ===== WALLET STAMP TABLE COMPONENT (COMPACT) =====
 * Used in the wallet page's ALL tab (1/3 tokens + 2/3 stamps split) — same
 * row/cell styling as WalletStampOverview.tsx, fewer columns. */
import { colGroup } from "$components/layout/types.ts";
import { PlaceholderImage } from "$icon";
import StampTextContent from "$islands/content/stampDetailContent/StampTextContent.tsx";
import {
  cellCenterL2Card,
  cellLeftL2Card,
  cellRightL2Card,
  cellStickyLeft,
  cellStickyLeft2,
  container2,
  EmptyState,
  shadowGlowPurple,
} from "$layout";
import {
  isBrowser,
  safeNavigate,
} from "$lib/utils/navigation/freshNavigationUtils.ts";
import {
  formatBTCAmount,
  formatSupply,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { getStampImageSrc } from "$lib/utils/ui/media/imageUtils.ts";
import { cardRowStampNumber, labelXxs, textXs } from "$text";
import { useState } from "preact/hooks";
import type { WalletStampBalanceRow } from "./WalletStampOverview.tsx";

/* ===== CONSTANTS ===== */
const HEADERS = ["IMAGE", "STAMP #", "CPID", "PRICE", "BALANCE", "VALUE"];

// VALUE is hidden from tablet+ up (see below) — BALANCE becomes the
// visually "last" column at that breakpoint, so it picks up the rounded
// right edge/border/alignment VALUE would otherwise own.
const cellBalanceCompact =
  `${cellCenterL2Card} tablet:rounded-r-2xl tablet:border-r-[1px] tablet:!pr-3 tablet:text-right`;

/* ===== HELPERS ===== */
function toRealUnits(amount: number, divisible: boolean): number {
  return divisible ? amount / 100000000 : amount;
}

/* ===== ROW COMPONENT ===== */
interface WalletStampOverviewRowCompactProps {
  stamp: WalletStampBalanceRow;
}

export function WalletStampOverviewRowCompact(
  { stamp }: WalletStampOverviewRowCompactProps,
) {
  const imgSrc = getStampImageSrc(stamp);
  // getStampImageSrc points HTML (and some other) mimetypes at a content
  // URL that can't render inside an <img> — track load failure so we swap
  // to the placeholder icon instead of leaving a broken-image icon.
  const [imageFailed, setImageFailed] = useState(false);
  const href = `/stamp/${stamp.tx_hash}`;

  const divisible = Boolean(stamp.divisible);
  const owned = Number(stamp.balance ?? 0);
  const issued = Number(stamp.supply ?? 0);
  const floor = stamp.market_data?.floor_price_btc ?? 0;

  const balanceDisplay = `${formatSupply(owned, divisible)}/${
    issued < 100000 && !divisible ? formatSupply(issued, divisible) : "+100000"
  }`;

  const value = stamp.market_data?.wallet_value_btc ??
    floor * toRealUnits(owned, divisible);

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
      {/* IMAGE */}
      <td
        class={`${cellLeftL2Card} ${cellStickyLeft}`}
      >
        <a
          href={href}
          f-partial={href}
          target="_top"
          class="flex items-center justify-center w-6.5 h-6.5 rounded-xl overflow-hidden"
        >
          {stamp.stamp_mimetype === "text/plain"
            ? (
              <div class="w-6.5 h-6.5 rounded-xl overflow-hidden">
                <StampTextContent src={imgSrc} />
              </div>
            )
            : imgSrc && !imageFailed
            ? (
              <img
                src={imgSrc}
                alt={`Stamp ${stamp.stamp ?? stamp.cpid ?? ""}`}
                class="w-6.5 h-6.5 object-contain rounded-xl pixelart"
                onError={() => setImageFailed(true)}
              />
            )
            : <PlaceholderImage variant="no-image" className="!rounded-xl" />}
        </a>
      </td>

      {/* STAMP # */}
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
            : "—"}
        </a>
      </td>

      {/* CPID */}
      <td
        class={`${cellCenterL2Card} font-mono text-color-neutral-400`}
      >
        {stamp.cpid ?? "—"}
      </td>

      {/* PRICE */}
      <td
        class={`${cellCenterL2Card} text-color-secondary-400`}
      >
        {floor > 0
          ? formatBTCAmount(floor, { includeSymbol: true, decimals: 8 })
          : <span class="text-color-neutral-500">N/A</span>}
      </td>

      {/* BALANCE */}
      <td
        class={`${cellBalanceCompact} text-color-primary-400`}
      >
        {balanceDisplay}
      </td>

      {
        /* VALUE — hidden from tablet+ up, BALANCE takes over the last-
       * column styling at that breakpoint (see cellBalanceCompact). */
      }
      <td
        class={`${cellRightL2Card} text-color-neutral-200 pr-3 tablet:hidden`}
      >
        {value > 0
          ? formatBTCAmount(value, { includeSymbol: true, decimals: 8 })
          : <span class="text-color-neutral-500">N/A</span>}
      </td>
    </tr>
  );
}

/* ===== TABLE WRAPPER ===== */
interface WalletStampOverviewTableCompactProps {
  stamps: WalletStampBalanceRow[];
}

export function WalletStampOverviewTableCompact(
  { stamps }: WalletStampOverviewTableCompactProps,
) {
  return (
    <div class="overflow-x-auto tablet:overflow-x-visible scrollbar-hide -my-3">
      <table
        class={`w-full border-separate border-spacing-y-3 ${textXs}`}
      >
        <colgroup>
          {colGroup([
            { width: "w-10" }, // IMAGE (fixed for sticky left-0 anchor)
            { width: "min-w-[90px] w-auto" }, // STAMP #
            { width: "min-w-[130px] w-auto" }, // CPID
            { width: "min-w-[100px] w-auto" }, // PRICE
            { width: "min-w-[110px] w-auto" }, // BALANCE
            { width: "min-w-[110px] w-auto tablet:hidden" }, // VALUE
          ]).map((col) => <col key={col.key} class={col.className} />)}
        </colgroup>
        <thead>
          <tr class={`${container2}`}>
            {HEADERS.map((header, i) => {
              const isFirst = i === 0;
              const isLast = i === HEADERS.length - 1;
              const isBalance = header === "BALANCE";
              const rowClass = header === "VALUE"
                ? `${cellRightL2Card} tablet:hidden`
                : isBalance
                ? cellBalanceCompact
                : isFirst
                ? cellLeftL2Card
                : isLast
                ? cellRightL2Card
                : cellCenterL2Card;
              const stickyClass = isFirst
                ? cellStickyLeft
                : i === 1
                ? cellStickyLeft2
                : "";
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
              <WalletStampOverviewRowCompact
                key={stamp.tx_hash}
                stamp={stamp}
              />
            ))
            : (
              <tr>
                <td colSpan={HEADERS.length}>
                  <EmptyState label="NO STAMPS IN WALLET" icon="artStamps" />
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
