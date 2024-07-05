import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";

export const HomeSalesInfoDetails = (
  { stamps = [] }: {
    stamps: [];
  },
) => {
  return (
    <div>
      <div class="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-6 gap-4 py-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard
            stamp={stamp}
            kind="stamp"
          />
        ))}
      </div>
    </div>
  );
};
