import { StampRow } from "globals";

import { StampCard } from "../stamp/StampCard.tsx";

export const CollectionDetailsContent = ({ stamps = [] }: {
  stamps: StampRow[];
}) => {
  return (
    <div name="stamps">
      <div class="grid grid-cols-2 tablet:grid-cols-4 desktop:grid-cols-5 gap-2 tablet:gap-4 desktop:gap-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => <StampCard stamp={stamp} />)}
      </div>
    </div>
  );
};
