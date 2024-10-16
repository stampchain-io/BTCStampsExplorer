import { useEffect, useState } from "preact/hooks";

import { STAMP_FILTER_TYPES, STAMP_TYPES } from "globals";

import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/filter.tsx";
import { Sort } from "$islands/Sort.tsx";

export const StampHeader = (
  { filterBy, sortBy, type }: {
    filterBy: STAMP_FILTER_TYPES[];
    sortBy: string;
    type: STAMP_TYPES;
  },
) => {
  const { setTypeOption } = useNavigator();
  const [currentFilters, setCurrentFilters] = useState<STAMP_FILTER_TYPES[]>(
    filterBy,
  );
  const [currentSort, setCurrentSort] = useState<string>(sortBy);

  useEffect(() => {
    const handleUrlChange = (event: CustomEvent) => {
      const url = new URL(event.detail);
      const newFilters =
        url.searchParams.get("filterBy")?.split(",") as STAMP_FILTER_TYPES[] ||
        [];
      const newSort = url.searchParams.get("sortBy") || "DESC";
      setCurrentFilters(newFilters);
      setCurrentSort(newSort);
      // Here you would typically fetch new data based on the updated filters and sort
    };

    self.addEventListener("urlChanged", handleUrlChange as EventListener);

    return () => {
      self.removeEventListener("urlChanged", handleUrlChange as EventListener);
    };
  }, []);

  const [isOpen1, setIsOpen1] = useState(false);
  const [isOpen2, setIsOpen2] = useState(false);

  const handleOpen1 = (open: boolean) => {
    setIsOpen1(open);
    setIsOpen2(false);
  };

  const handleOpen2 = (open: boolean) => {
    setIsOpen1(false);
    setIsOpen2(open);
  };

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between gap-3 w-full">
      <p className="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] text-3xl md:text-6xl font-black">
        ART STAMPS
      </p>
      <div class="flex gap-3 justify-between">
        <Sort initSort={currentSort} />
        <Filter
          initFilter={currentFilters}
          initSort={currentSort}
          initType={type}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "pixel",
            "vector",
            "for_sale",
            "trendy sales",
            "sold",
          ]}
          isStamp={true}
        />
        {
          /* <StampNavigator
          initFilter={currentFilters}
          initSort={currentSort}
          initType={type}
          open1={isOpen1}
          handleOpen1={handleOpen1}
        /> */
        }
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
};
