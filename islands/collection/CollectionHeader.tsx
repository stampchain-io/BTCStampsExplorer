import { useState } from "preact/hooks";

import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "../datacontrol/Filter.tsx";
import type { COLLECTION_FILTER_TYPES } from "globals";

interface TabOption {
  key: string;
  label: string;
}

interface CollectionHeaderProps {
  filterBy: COLLECTION_FILTER_TYPES[];
  sortBy: string;
  selectedTab: string;
}

const TAB_OPTIONS: TabOption[] = [
  { key: "all", label: "ALL" },
  { key: "stamps", label: "STAMPS" },
  { key: "posh", label: "POSH" },
];

function CollectionHeader(
  { filterBy, sortBy, selectedTab }: CollectionHeaderProps,
) {
  const { setTypeOption } = useNavigator();

  // State management for the open states
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
    <div class="flex flex-col-reverse tablet:flex-row justify-between items-center w-full">
      <div class="flex gap-6 tablet:gap-8 items-end">
        {TAB_OPTIONS.map(({ key, label }) => (
          <TabButton
            key={key}
            isSelected={selectedTab === key}
            onClick={() => setTypeOption("collection", key)}
          >
            {label}
          </TabButton>
        ))}
      </div>
      <div class="flex gap-3 justify-between h-[40px]">
        <Filter
          initFilter={filterBy}
          open={isOpen1}
          handleOpen={handleOpen1}
          filterButtons={[
            "all",
            "posh",
            "recursive",
            "artists",
          ]}
        />
        <StampSearchClient open2={isOpen2} handleOpen2={handleOpen2} />
      </div>
    </div>
  );
}

interface TabButtonProps {
  isSelected: boolean;
  onClick: () => void;
  children: string;
}

function TabButton({ isSelected, onClick, children }: TabButtonProps) {
  const baseClasses = "text-[19px] cursor-pointer pb-4";
  const selectedClasses =
    "text-[#7A00F5] font-semibold border-b-4 border-b-[#7A00F5]";
  const unselectedClasses = "text-[#B9B9B9]";

  return (
    <button
      class={`${baseClasses} ${
        isSelected ? selectedClasses : unselectedClasses
      }`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export { CollectionHeader };
