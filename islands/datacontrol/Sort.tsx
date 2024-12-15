import { useEffect, useState } from "preact/hooks";
import { useURLUpdate } from "$client/hooks/useURLUpdate.ts";
import { Button } from "$components/shared/Button.tsx";

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
    <Button
      variant="icon"
      icon={`${
        localSort === "DESC"
          ? "/img/stamp/SortAscending"
          : "/img/stamp/SortDescending"
      }.svg`}
      iconAlt={`Sort ${localSort === "DESC" ? "ascending" : "descending"}`}
      onClick={handleSortChange}
      class="border-2 border-[#8800CC] bg-transparent rounded-md"
    />
  );
}
