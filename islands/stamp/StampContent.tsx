import { StampCard } from "$islands/stamp/StampCard.tsx";
import { StampRow } from "globals";

export function StampContent({ stamps, isRecentSales = false }: {
  stamps: (StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  })[];
  isRecentSales?: boolean;
}) {
  return (
    <div class="w-full pt-[2px] pb-[18px] mobileSm:pt-[2px] mobileSm:pb-[18px] 
      mobileLg:pt-[2px] mobileLg:pb-[36px] tablet:pt-[2px] tablet:pb-[72px] 
      desktop:pt-[2px] desktop:pb-[72px]">
      <div class="grid grid-cols-2 mobileSm:grid-cols-2 mobileLg:grid-cols-4 w-full gap-2  mobileLg:gap-4 
        tablet:gap-6 desktop:gap-[24px] tablet:grid-cols-3 desktop:grid-cols-4 auto-rows-fr">
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
