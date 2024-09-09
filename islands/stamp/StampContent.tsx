// import { useEffect, useState } from "preact/hooks";

import { StampRow } from "globals";

import { StampCard } from "$components/stamp/StampCard.tsx";
// import { filterOptions, sortOptions } from "utils/stampUtils.ts";

export function StampContent(
  { stamps = [] }: {
    stamps: StampRow[];
  },
) {
  return (
    <div name="stamps">
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-2 md:gap-4 xl:gap-6 py-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard stamp={stamp} kind="stamp" />
        ))}
      </div>
    </div>
  );
}
