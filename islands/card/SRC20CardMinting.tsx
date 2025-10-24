/* ===== SRC20 CARD MINTING COMPONENT ===== */
/*@baba-check styles*/
import { Button } from "$button";
import { cellAlign } from "$components/layout/types.ts";
import { SRC20CardBase } from "$islands/card/SRC20CardBase.tsx";
import { formatDate } from "$lib/utils/ui/formatting/formatUtils.ts";
import { valueSm } from "$text";
import type { SRC20CardBaseProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function SRC20CardMinting(
  { src20, fromPage, onImageClick, totalColumns }: SRC20CardBaseProps,
) {
  // Early return if src20 is null or undefined
  if (!src20) {
    return null;
  }

  /* ===== COMPUTED VALUES ===== */
  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }&trxType=olga`;

  const handleMintClick = (event: MouseEvent) => {
    event.preventDefault();
    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot navigate during SSR
    }
    globalThis.location.href = mintHref;
  };

  /* ===== RENDER ===== */
  return (
    <SRC20CardBase
      src20={src20}
      {...(fromPage && { fromPage })}
      {...(onImageClick && { onImageClick })}
      totalColumns={totalColumns ?? 1}
    >
      {/* Deploy Cell */}
      <td class={`${cellAlign(1, totalColumns ?? 1)} ${valueSm}`}>
        {formatDate(new Date(src20.block_time), {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }).toUpperCase()}
      </td>

      {/* Holders Cell */}
      <td class={`${cellAlign(2, totalColumns ?? 1)} ${valueSm}`}>
        {Number(
          (src20 as any)?.market_data?.holder_count ||
            (src20 as any)?.holders || 0,
        ).toLocaleString()}
      </td>

      {/* TRENDING */}
      <td class={`${cellAlign(3, totalColumns ?? 1)} ${valueSm}`}>
        {src20.top_mints_percentage?.toFixed(1) || "N/A"}
        <span class="text-color-grey-light">%</span>
      </td>

      {/* MINTS */}
      <td class={`${cellAlign(4, totalColumns ?? 1)} ${valueSm}`}>
        {src20.mint_progress?.total_mints || "N/A"}
      </td>

      {/* Progress Cell */}
      <td class={`${cellAlign(5, totalColumns ?? 1)} ${valueSm}`}>
        <div class="flex flex-col gap-1">
          <div class="text-right">
            {Number(src20.progress ?? 0)}
            <span class="text-color-grey-light">%</span>
          </div>
          <div class="relative h-1.5 bg-color-grey rounded-full">
            <div
              class="absolute left-0 top-0 h-1.5 bg-color-purple-dark rounded-full"
              style={{ width: `${src20.progress ?? 0}%` }}
            />
          </div>
        </div>
      </td>

      {/* MINT BUTTON */}
      <td class={`${cellAlign(6, totalColumns ?? 1)}`}>
        <Button
          variant="flat"
          color="purple"
          size="sm"
          href={mintHref}
          onClick={handleMintClick}
          class={(fromPage != "stamping/src20" && fromPage != "home")
            ? "hidden min-[480px]:block hover:bg-color-purple-light transition-colors"
            : "hover:bg-color-purple-light transition-colors"}
        >
          MINT
        </Button>
      </td>
    </SRC20CardBase>
  );
}
