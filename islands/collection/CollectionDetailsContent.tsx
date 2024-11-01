import { StampRow } from "globals";

import { StampCard } from "../stamp/StampCard.tsx";

export const CollectionDetailsContent = ({ stamps = [] }: {
  stamps: StampRow[];
}) => {
  return (
    <div name="stamps">
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-2 md:gap-4 xl:gap-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard stamp={stamp} kind="stamp" />
        ))}
      </div>
    </div>
  );
};
