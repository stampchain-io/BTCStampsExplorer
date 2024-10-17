import { useState } from "preact/hooks";

// import { StampHolders } from "$components/stampDetails/StampHolders.tsx";
import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampTransfers } from "$components/stampDetails/StampTransfers.tsx";
// import { StampVaults } from "$components/stampDetails/StampVaults.tsx";

// TODO: Replace 'any' with a more specific type
interface StampRelatedInfoProps {
  sends: any;
  dispensers: any;
  holders: any;
  dispensesWithRates: any;
}

type TabType = "dispensers" | "sales" | "transfers";

const tabs: Array<{ id: TabType; label: string }> = [
  { id: "dispensers", label: "Dispensers" },
  { id: "sales", label: "Sales" },
  { id: "transfers", label: "Transfers" },
];

export function StampRelatedInfo(
  { sends, dispensers, holders, dispensesWithRates }: StampRelatedInfoProps,
) {
  const [selectedTab, setSelectedTab] = useState("dispensers");

  console.log("holders: ", holders);

  const renderTabContent = () => {
    switch (selectedTab) {
      case "dispensers":
        return <StampDispensers dispensers={dispensers} />;
      case "sales":
        return <StampSales dispenses={dispensesWithRates} />;
      case "transfers":
        return <StampTransfers sends={sends} />;
    }
  };

  return (
    <>
      {/* <StampHolders holders={holders} /> */}

      <div class="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6">
        <div class="flex justify-between w-full overflow-y-auto text-[#666666] text-sm md:text-[19px]">
          {tabs.map(({ id, label }) => (
            <p
              key={id}
              class={`cursor-pointer pb-4 ${
                selectedTab === id ? "font-bold" : ""
              }`}
              onClick={() => setSelectedTab(id)}
            >
              {label}
            </p>
          ))}
        </div>
        {renderTabContent()}
      </div>
    </>
  );
}
