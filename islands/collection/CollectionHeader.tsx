import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/NavigatorProvider.tsx";
import { Filter } from "$islands/Filter.tsx";

interface TabOption {
  key: string;
  label: string;
}

interface CollectionHeaderProps {
  filterBy: unknown[];
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

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
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
      <div class="flex gap-3 md:gap-6 justify-between">
        <Filter
          initFilter={filterBy}
          initSort={sortBy}
          // initType={type}
          // selectedTab={selectedTab}
          // open={isOpen1}
          // handleOpen={handleOpen1}
          filterButtons={[
            "all",
            "posh",
            "recursive",
            "artists",
          ]}
          isStamp={false}
        />
        {/* <StampNavigator initFilter={filterBy} initSort={sortBy} /> */}
        <StampSearchClient />
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
