import { StampCard } from "./StampCard.tsx";
import { StampRow } from "globals";

export function StampContent({ stamps, isRecentSales = false }: {
  stamps: (StampRow & {
    sale_data?: { btc_amount: number; block_index: number; tx_hash: string };
  })[];
  isRecentSales?: boolean;
}) {
  return (
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-2 md:gap-4 xl:gap-6 py-6 transition-opacity duration-700 ease-in-out">
      {stamps.map((stamp) => (
        <StampCard
          key={stamp.tx_hash}
          stamp={stamp}
          kind="stamp"
          isRecentSale={isRecentSales}
          showInfo={true}
          showDetails={true}
        />
      ))}
    </div>
  );
}
