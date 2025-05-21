/* ===== STAMP OVERVIEW CONTENT COMPONENT ===== */
import { StampRow } from "$globals";
import { StampCard } from "$card";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";

/* ===== TYPES ===== */
interface StampOverviewContentProps {
  stamps: StampRow[];
  isRecentSales?: boolean;
  fromPage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
}

/* ===== COMPONENT ===== */
export function StampOverviewContent({
  stamps,
  isRecentSales = false,
  pagination,
  fromPage,
}: StampOverviewContentProps) {
  /* ===== RENDER ===== */
  return (
    <div class="w-full pt-3">
      {/* ===== STAMPS GRID ===== */}
      <div class="grid grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6 gap-3 mobileMd:gap-6 w-full auto-rows-fr">
        {stamps.map((stamp) => (
          <StampCard
            key={isRecentSales && stamp.sale_data
              ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}`
              : stamp.tx_hash}
            stamp={stamp}
            isRecentSale={isRecentSales}
            showDetails
            variant="grey"
            fromPage={fromPage}
          />
        ))}
      </div>

      {/* ===== PAGINATION ===== */}
      {pagination && pagination.totalPages > 1 && (
        <div class="mt-12 mobileLg:mt-[72px]">
          <Pagination
            page={pagination.page}
            totalPages={pagination.totalPages}
            prefix={pagination.prefix}
            onPageChange={pagination.onPageChange}
          />
        </div>
      )}
    </div>
  );
}
