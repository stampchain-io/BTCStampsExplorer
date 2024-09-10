import { useEffect, useState } from "preact/hooks";

import { StampSends } from "$components/stampDetails/StampSends.tsx";
import { StampHolders } from "$components/stampDetails/StampHolders.tsx";
import { StampDispensers } from "$components/stampDetails/StampDispensers.tsx";
import { StampSales } from "$components/stampDetails/StampSales.tsx";
import { StampVaults } from "$components/stampDetails/StampVaults.tsx";

export function StampRelatedInfo(
  { sends, dispensers, holders, dispensesWithRates }: {
    sends: any;
    dispensers: any;
    holders: any;
    dispensesWithRates: any;
  },
) {
  const [selectedTab, setSelectedTab] = useState("dispensers");

  useEffect(() => {
    console.log(selectedTab);
  }, [selectedTab]);

  return (
    <div class="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6">
      <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E] overflow-y-auto">
        <div class="flex gap-4 md:gap-8 items-end">
          <p
            class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
              selectedTab === "dispensers"
                ? "font-bold border-b-4 border-b-[#8800CC]"
                : ""
            }`}
            onClick={() => setSelectedTab("dispensers")}
          >
            Dispensers
          </p>
          <p
            class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
              selectedTab === "sales"
                ? "font-bold border-b-4 border-b-[#8800CC]"
                : ""
            }`}
            onClick={() => setSelectedTab("sales")}
          >
            Sales
          </p>
          <p
            class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
              selectedTab === "holders"
                ? "font-bold border-b-4 border-b-[#8800CC]"
                : ""
            }`}
            onClick={() => setSelectedTab("holders")}
          >
            Holders
          </p>

          <p
            class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
              selectedTab === "transfers"
                ? "font-bold border-b-4 border-b-[#8800CC]"
                : ""
            }`}
            onClick={() => setSelectedTab("transfers")}
          >
            Transfers
          </p>
          <p
            class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
              selectedTab === "vaults"
                ? "font-bold border-b-4 border-b-[#8800CC]"
                : ""
            }`}
            onClick={() => setSelectedTab("vaults")}
          >
            Vaults
          </p>
        </div>
      </div>
      {selectedTab === "dispensers" && (
        <StampDispensers dispensers={dispensers} />
      )}
      {selectedTab === "sales" && <StampSales dispenses={dispensesWithRates} />}
      {selectedTab === "holders" && <StampHolders holders={holders} />}
      {selectedTab === "transfers" && <StampSends sends={sends} />}
      {selectedTab === "vaults" && <StampVaults vaults={[]} />}
    </div>
  );
}
