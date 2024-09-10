import { StampNavigator } from "$islands/stamp/StampNavigator.tsx"; // FIXME: stampnavigator doesn't make sense here. maybe a src20navigator
import { StampSearchClient } from "$islands/stamp/StampSearch.tsx";
import { useNavigator } from "$islands/Navigator/navigator.tsx";

interface TabInfo {
  key: string;
  label: string;
}

const tabs: TabInfo[] = [
  { key: "all", label: "ALL" },
  { key: "trending", label: "TRENDING" },
  { key: "mints", label: "MINTS" },
];

export const SRC20Header = (
  { filterBy, sortBy, selectedTab }: {
    filterBy: any[];
    sortBy: string;
    selectedTab: string;
  },
) => {
  const { setTypeOption } = useNavigator();

  return (
    <div class="text-white flex flex-col gap-8">
      <div class="text-center">
        <p class="text-7xl leading-normal">SRC-20</p>
        <p class="text-[#DBDBDB] font-light">
          Welcome to the forefront of digital collectibles, where each stamp is
          a unique<br />
          piece of art intertwined with the immutability of the blockchain.
        </p>
      </div>
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
              onClick={() => setTypeOption("src20", tab.key)}
            >
              {tab.label}
            </p>
          ))}
        </div>
        <div class="flex gap-6">
          <StampNavigator initFilter={filterBy} initSort={sortBy} />
          <StampSearchClient />
        </div>
      </div>
    </div>
  );
};
