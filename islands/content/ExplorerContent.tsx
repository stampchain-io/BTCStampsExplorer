/* ===== EXPLORER CONTENT COMPONENT ===== */
import { PaginationButtons } from "$button";
import { StampCard } from "$card";
import type { StampRow } from "$types/stamp.d.ts";
import type { ExplorerContentProps } from "$types/ui.d.ts";

/* ===== TYPES ===== */

/* ===== COMPONENT ===== */
export function ExplorerContent({
  stamps,
  isRecentSales = false,
  pagination,
  fromPage,
}: ExplorerContentProps) {
  /* ===== RENDER ===== */
  return (
    <div class="w-full pt-3">
      {/* ===== STAMPS GRID ===== */}
      <div class="grid grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6 gap-6 w-full auto-rows-fr">
        {(stamps ?? []).map((stamp: StampRow, index: number) => (
          <StampCard
            key={isRecentSales && stamp.sale_data
              ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}-${stamp.sale_data.block_index}-${index}`
              : stamp.tx_hash}
            stamp={stamp}
            isRecentSale={isRecentSales}
            showDetails
            variant="grey"
            {...(fromPage && { fromPage })}
          />
        ))}
      </div>

      {/* ===== PAGINATION ===== */}
      {pagination && pagination.totalPages > 1 && (
        <div class="mt-12 mobileLg:mt-[72px]">
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
