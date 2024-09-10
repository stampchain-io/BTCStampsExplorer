import { StampNavigator } from "$islands/stamp/StampNavigator.tsx";
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

interface TabInfo {
  key: string;
  label: string;
}

const tabs: TabInfo[] = [
  { key: "all", label: "ALL" },
  { key: "stamps", label: "STAMPS" },
  { key: "posh", label: "POSH" },
];

export const CollectionHeader = (
  { filterBy, sortBy, selectedTab }: {
    filterBy: any[];
    sortBy: string;
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

  return (
    <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E]">
      <div class="flex gap-6 md:gap-8 items-end">
        {tabs.map((tab) => (
          <p
            key={tab.key}
            class={`text-[19px] cursor-pointer pb-4 ${
              selectedTab === tab.key
                ? "text-[#7A00F5] font-semibold border-b-4 border-b-[#7A00F5]"
                : "text-[#B9B9B9]"
            }`}
            onClick={() => setTypeOption("collection", tab.key)}
          >
            {tab.label}
          </p>
        ))}
      </div>
      <div class="flex gap-3 md:gap-6 justify-between">
        <StampNavigator initFilter={filterBy} initSort={sortBy} />
        <StampSearchClient />
      </div>
    </div>
  );
};
