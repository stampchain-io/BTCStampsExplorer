/* ===== STAMP OVERVIEW CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import { StampCard } from "$card";
import { containerBackground, gridCard } from "$layout";
import { valueDark } from "$text";
import type { StampCardVariant, StampRow } from "$types/stamp.d.ts";
import type { StampOverviewContentProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function StampOverviewContent({
  stamps,
  isRecentSales = false,
  pagination,
  viewMode = "cardVertical",
}: StampOverviewContentProps) {
  const cardVariant: StampCardVariant = viewMode === "cardSquare"
    ? "cardSquare"
    : "cardVerticalDetail";

  /* ===== RENDER ===== */
  return (
    <div class="w-full pt-5">
      {stamps?.length
        ? (
          <div class={gridCard(viewMode)}>
            {stamps.map((stamp: StampRow, index: number) => (
              <StampCard
                key={isRecentSales && stamp.sale_data
                  ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}-${stamp.sale_data.block_index}-${index}`
                  : stamp.tx_hash}
                stamp={stamp}
                isRecentSale={isRecentSales}
                variant={cardVariant}
              />
            ))}
          </div>
        )
        : (
          <div
            class={`${containerBackground} flex-col flex justify-center items-center`}
          >
            <img src="/img/ic_content.svg" width="160" />
            <h6 class={`py-2 ${valueDark} text-center`}>NO STAMPS</h6>
          </div>
        )}
      {pagination && (
        <PaginationButtons
          page={pagination.page}
          totalPages={pagination.totalPages}
          {...(pagination.prefix && { prefix: pagination.prefix })}
          {...(pagination.onPageChange &&
            { onPageChange: pagination.onPageChange })}
        />
      )}
    </div>
  );
}
