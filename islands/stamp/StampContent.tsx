import { StampCard } from "$islands/stamp/StampCard.tsx";
import { StampRow } from "globals";

export function StampContent({ stamps, isRecentSales = false }: {
  stamps: (StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  })[];
  isRecentSales?: boolean;
}) {
  return (
    <div class="w-full pt-3 pb-12 mobileMd:pt-6 mobileMd:pb-[72px]">
      <div class="grid grid-cols-2 mobileMd:grid-cols-3 mobileLg:grid-cols-4 tablet:grid-cols-5 desktop:grid-cols-6 gap-3 mobileMd:gap-6 w-full auto-rows-fr">
        {stamps.map((stamp) => (
          <StampCard
            key={stamp.tx_hash}
            stamp={stamp}
            isRecentSale={isRecentSales}
            showDetails={true}
            variant="grey"
          />
        ))}
      </div>
    </div>
  );
}
