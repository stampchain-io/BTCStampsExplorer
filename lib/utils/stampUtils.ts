import { StampRow } from "globals";

export const sortData = (
  stamps: StampRow[],
  sortBy: string,
  order: "ASC" | "DESC",
): StampRow[] => {
  const sortedStamps = [...stamps].sort((a, b) => {
    switch (sortBy) {
      case "Supply":
        return a.supply - b.supply;
      case "Block":
        return a.block_index - b.block_index;
      case "Stamp":
        return (a.stamp ?? 0) - (b.stamp ?? 0);
      default:
        return (a.stamp ?? 0) - (b.stamp ?? 0);
    }
  });

  return order === "DESC" ? sortedStamps.reverse() : sortedStamps;
};

export function filterData(data: StampRow[], filterBy: string[]): StampRow[] {
  if (!filterBy || filterBy.length === 0) return data;

  return data.filter((item) =>
    filterBy.some((filter) =>
      Object.entries(item).some(([key, value]) =>
        value != null &&
        value.toString().toLowerCase().includes(filter.toLowerCase())
      )
    )
  );
}
