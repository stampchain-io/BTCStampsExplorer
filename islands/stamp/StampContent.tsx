import { StampCard } from "$islands/stamp/StampCard.tsx";
import { StampRow } from "globals";

// FIXME: transition this to stampsection
export function StampContent({ stamps, isRecentSales = false }: {
  stamps: (StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  })[];
  isRecentSales?: boolean;
}) {
  return (
    <div className="grid grid-cols-2 mobileLg:grid-cols-4 gap-2 mobileLg:gap-4 tablet:gap-6 py-6 
      transition-opacity duration-700 ease-in-out">
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
  );
}
