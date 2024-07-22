// import { useEffect, useState } from "preact/hooks";

import { StampRow } from "globals";

import { StampCard } from "$components/StampCard.tsx";

// import { StampRepository } from "$lib/database/index.ts";

// const sortData = (stamps: StampRow[], sortBy: string) => {
//   const data = [...stamps];
//   if (sortBy == "Supply") {
//     return [...data.sort((a: StampRow, b: StampRow) => a.supply - b.supply)];
//   } else if (sortBy == "Block") {
//     return [
//       ...data.sort((a: StampRow, b: StampRow) => a.block_index - b.block_index),
//     ];
//   } else if (sortBy == "Stamp") {
//     return [...data.sort((a: StampRow, b: StampRow) => a.stamp - b.stamp)];
//   } else return [...data];
// };

// const filterData = (stamps: StampRow[], filterBy: string[]) => {
//   if (filterBy.length == 0) {
//     return stamps;
//   }
//   return stamps.filter((stamp) =>
//     filterBy.find((option) =>
//       stamp.stamp_mimetype.indexOf(option.toLowerCase()) >= 0
//     ) != null
//   );
// };

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
