import { StampRow } from "globals";
import { StampCard } from "$components/StampCard.tsx";

export const HomeSalesInfoDetails = ({ stamps = [] }: { stamps: [] }) => {
  return (
    <div>
      <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out">
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
