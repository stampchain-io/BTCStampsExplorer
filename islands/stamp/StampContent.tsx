// import { useEffect, useState } from "preact/hooks";

import { StampRow } from "globals";

import { StampCard } from "$components/StampCard.tsx";
// import { filterOptions, sortOptions } from "utils/stampUtils.ts";

export function StampContent(
  { stamps = [] }: {
    stamps: StampRow[];
  },
) {
  // useEffect(() => {
  //   if (stamps.length > 0) {
  //     console.log("updated!!!!", stamps.length, stamps.at(0));

  //     setContent([...filterData(sortData(stamps, sortOption), filterOption)]);
  //   }
  // }, [sortOption, filterOption]);

  return (
    <div name="stamps">
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-6 gap-4 py-6 transition-opacity duration-700 ease-in-out">
        {stamps.map((stamp: StampRow) => (
          <StampCard stamp={stamp} kind="stamp" />
        ))}
      </div>
    </div>
  );
}
