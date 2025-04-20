/* ===== SRC20 CARD MINTING COMPONENT ===== */
/*@baba-check styles*/
import { SRC20CardBase, SRC20CardBaseProps } from "./SRC20CardBase.tsx";
import { formatDate } from "$lib/utils/formatUtils.ts";
import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { Button } from "$button";
import { labelSm, textSm } from "$text";
import { cellAlign, tableValue } from "$components/table/TableStyles.ts";

/* ===== COMPONENT ===== */
export function SRC20CardMinting(
  { src20, fromPage, onImageClick, totalColumns }: SRC20CardBaseProps,
) {
  /* ===== COMPUTED VALUES ===== */
  const mintHref = `/stamping/src20/mint?tick=${
    encodeURIComponent(src20.tick)
  }&trxType=olga`;

  const handleMintClick = (event: MouseEvent) => {
    event.preventDefault();
    globalThis.location.href = mintHref;
  };

  /* ===== RENDER ===== */
  return (
    <SRC20CardBase
      src20={src20}
      fromPage={fromPage}
      onImageClick={onImageClick}
      totalColumns={totalColumns}
    >
      {/* Deploy Cell */}
      <td class={`${cellAlign(1, totalColumns)} ${tableValue}`}>
        {formatDate(new Date(src20.block_time), {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }).toUpperCase()}
      </td>

      {/* Holders Cell */}
      <td class={`${cellAlign(2, totalColumns)} ${tableValue}`}>
        {Number(src20.holders).toLocaleString()}
      </td>

      {/* TRENDING */}
      <td class={`${cellAlign(3, totalColumns)} ${tableValue}`}>
        {src20.top_mints_percentage?.toFixed(1) || "N/A"}
        <span class="text-stamp-grey-light">%</span>
      </td>

      {/* MINTS */}
      <td class={`${cellAlign(4, totalColumns)} ${tableValue}`}>
        {src20.mint_count || "N/A"}
      </td>

      {/* Progress Cell */}
      <td class={`${cellAlign(5, totalColumns)} ${tableValue}`}>
        <div class="flex flex-col gap-1">
          <div class="text-right">
            {Number(src20.progress)}
            <span class="text-stamp-grey-light">%</span>
          </div>
          <div class="relative h-1.5 bg-stamp-grey rounded-full">
            <div
              class="absolute left-0 top-0 h-1.5 bg-stamp-purple-dark rounded-full"
              style={{ width: `${src20.progress}%` }}
            />
          </div>
        </div>
      </td>

      {/* MINT BUTTON */}
      <td class={`${cellAlign(6, totalColumns)}`}>
        <Button
          variant="flat"
          color="purple"
          size="sm"
          href={mintHref}
          onClick={handleMintClick}
          class={(fromPage != "stamping/src20" && fromPage != "home")
            ? "hidden min-[480px]:block hover:bg-stamp-primary-hover transition-colors"
            : "hover:bg-stamp-primary-hover transition-colors"}
        >
          MINT
        </Button>
      </td>
    </SRC20CardBase>
  );
}
