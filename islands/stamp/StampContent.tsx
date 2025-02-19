import { StampCard } from "$islands/stamp/StampCard.tsx";
import { StampRow } from "$globals";
import { Pagination } from "$islands/datacontrol/Pagination.tsx";

interface StampContentProps {
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

export function StampContent({
  stamps,
  isRecentSales = false,
  pagination,
  fromPage,
}: StampContentProps) {
  return (
    <div class="w-full pt-3 pb-12 mobileMd:pt-6 mobileMd:pb-[72px]">
      {stamps?.length
        ? (
          <div class="grid grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6 gap-3 mobileMd:gap-6 w-full auto-rows-fr">
            {stamps.map((stamp) => (
              <StampCard
                key={isRecentSales && stamp.sale_data
                  ? `${stamp.tx_hash}-${stamp.sale_data.tx_hash}`
                  : stamp.tx_hash}
                stamp={stamp}
                isRecentSale={isRecentSales}
                showDetails={true}
                variant="grey"
                fromPage={fromPage}
              />
            ))}
          </div>
        )
        : (
          <div class="w-full flex-col flex justify-center items-center">
            <img src="/img/ic_content.svg" width="160" />
            <span class="text-stamp-grey">No Stamps</span>
          </div>
        )}
      {pagination && pagination.totalPages > 1 && (
        <div class="mt-9 mobileLg:mt-[72px]">
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
