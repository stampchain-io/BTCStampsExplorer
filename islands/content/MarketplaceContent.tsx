/* ===== MARKETPLACE CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import { StampCard } from "$card";
import { MarketplaceTableBase } from "$components/table/marketplaceTable/MarketplaceTableBase.tsx";
import { container2, gridCard } from "$layout";
import { valueDarkSm } from "$text";
import type { StampCardVariant, StampRow } from "$types/stamp.d.ts";
import type { MarketplaceContentProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function MarketplaceContent({
  stamps,
  isRecentSales = false,
  pagination,
  viewMode = "cardVertical",
}: MarketplaceContentProps) {
  const cardVariant: StampCardVariant = viewMode === "cardSquare"
    ? "cardSquare"
    : isRecentSales
    ? "cardVerticalSale"
    : "cardVerticalListing";

  /* ===== RENDER ===== */
  return (
    <div
      class={`w-full ${viewMode !== "cardRow" ? "pt-5" : "pt-2"}`}
    >
      {viewMode === "cardRow"
        ? (
          /* ===== ROW TABLE VIEW ===== */
          <MarketplaceTableBase
            stamps={stamps ?? []}
            isRecentSales={isRecentSales}
          />
        )
        : stamps?.length
        ? (
          /* ===== CARD GRID VIEW ===== */
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
            class={`${container2} flex-col flex justify-center items-center`}
          >
            <img src="/img/ic_content.svg" width="160" />
            <h6 class={`pb-3 ${valueDarkSm} text-center`}>
              {isRecentSales ? "NO SALES TO DISPLAY" : "NO LISTINGS TO DISPLAY"}
            </h6>
          </div>
        )}
      {pagination && pagination.totalPages > 1 && (
        <div class="mt-7.5 tablet:mt-10">
          <PaginationButtons
            page={pagination.page}
            totalPages={pagination.totalPages}
            {...(pagination.prefix && { prefix: pagination.prefix })}
            {...(pagination.onPageChange &&
              { onPageChange: pagination.onPageChange })}
          />
        </div>
      )}
    </div>
  );
}
