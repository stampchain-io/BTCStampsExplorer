import { useEffect, useState } from "preact/hooks";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";

interface SortProps {
  initSort?: "ASC" | "DESC";
}

export function Sort({ initSort = "DESC" }: SortProps) {
  const [localSort, setLocalSort] = useState<"ASC" | "DESC">(initSort);
  const { updateURL } = useURLUpdate();

  useEffect(() => {
    setLocalSort(initSort);
  }, [initSort]);

  const handleSortChange = () => {
    const newSort = localSort === "DESC" ? "ASC" : "DESC";
    setLocalSort(newSort);
    updateURL({ sortBy: newSort });
  };

  return (
    <button
      onClick={handleSortChange}
      class="border-2 border-[#8800CC] bg-transparent px-[10px] py-[10px] rounded-md"
    >
      <img
        src={`${
          localSort === "DESC"
            ? "/img/stamp/SortAscending"
            : "/img/stamp/SortDescending"
        }.svg`}
        alt={`Sort ${localSort === "DESC" ? "ascending" : "descending"}`}
      />
    </button>
  );
}
