import { StampRow } from "globals";

export const sortData = (
  stamps: StampRow[],
  sortBy: string,
  order: "ASC" | "DESC",
) => {
  let sortedStamps;
  if (sortBy == "Supply") {
    sortedStamps = stamps.sort((a, b) => a.supply - b.supply);
  } else if (sortBy == "Block") {
    sortedStamps = stamps.sort((a, b) => a.block_index - b.block_index);
  } else if (sortBy == "Stamp") {
    sortedStamps = stamps.sort((a, b) => (a.stamp ?? 0) - (b.stamp ?? 0));
  } else {
    sortedStamps = stamps.sort((a, b) => (a.stamp ?? 0) - (b.stamp ?? 0));
  }

  if (order === "DESC") {
    sortedStamps.reverse();
  }

  return sortedStamps;
};

export const filterData = (stamps: StampRow[], filterBy: string[]) => {
  if (filterBy.length == 0) {
    return stamps;
  }
  return stamps.filter((stamp) =>
    filterBy.find((option) =>
      stamp.stamp_mimetype.indexOf(option.toLowerCase()) >= 0
    ) != null
  );
};
