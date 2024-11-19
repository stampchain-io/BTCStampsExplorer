import { useState } from "preact/hooks";

import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampTransfers } from "$components/stampDetails/StampTransfers.tsx";

// TODO: Replace 'any' with a more specific type
interface StampRelatedInfoProps {
  sends: any;
  dispensers: any;
  dispensesWithRates: any;
}

type TabType = "dispensers" | "sales" | "transfers";

const tabs: Array<{ id: TabType; label: string }> = [
  { id: "dispensers", label: "DISPENSERS" },
  { id: "sales", label: "SALES" },
  { id: "transfers", label: "TRANSFERS" },
];

export function StampRelatedInfo(
  { sends, dispensers, dispensesWithRates }: StampRelatedInfoProps,
) {
  const [selectedTab, setSelectedTab] = useState("dispensers");

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
    <div class="dark-gradient p-2 tablet:p-6">
      <div class="flex justify-between w-full overflow-y-auto text-[#666666] text-sm tablet:text-[19px]">
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
  );
}
