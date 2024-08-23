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
    <>
      <div class="flex flex-col-reverse md:flex-row justify-between w-full border-b border-[#3F2A4E] overflow-y-auto">
        <div class="flex gap-6 md:gap-8 items-end">
          <p
            class={selectedTab === "dispensers"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("dispensers")}
          >
            Dispensers
          </p>
          <p
            class={selectedTab === "sales"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("sales")}
          >
            Sales
          </p>
          <p
            class={selectedTab === "holders"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("holders")}
          >
            Holders
          </p>

          <p
            class={selectedTab === "transfers"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("transfers")}
          >
            Transfers
          </p>
          <p
            class={selectedTab === "vaults"
              ? "text-[19px] text-[#7A00F5] font-semibold cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[19px] text-[#B9B9B9] cursor-pointer pb-4"}
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
    </>
  );
}
