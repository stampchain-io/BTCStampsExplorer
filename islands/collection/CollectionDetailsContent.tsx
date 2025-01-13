import { StampRow } from "$globals";

import { StampCard } from "$islands/stamp/StampCard.tsx";

export const CollectionDetailsContent = ({ stamps = [] }: {
  stamps: StampRow[];
}) => {
  return (
    <div name="stamps">
      <div className="grid grid-cols-2 mobileMd:grid-cols-3 tablet:grid-cols-4 desktop:grid-cols-5 gap-3 mobileMd:gap-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard
            key={stamp.tx_hash}
            stamp={stamp}
            variant="grey"
          />
        ))}
      </div>
    </div>
  );
};
