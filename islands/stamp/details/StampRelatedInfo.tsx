import { useState } from "preact/hooks";

import { StampHolders } from "$components/stampDetails/StampHolders.tsx";
import { StampSends } from "$components/stampDetails/StampSends.tsx";
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
  const [selectedTab1, setSelectedTab1] = useState("dispensers");
  const [selectedTab2, setSelectedTab2] = useState("vaults");

  console.log("holders: ", holders);

  return (
    <div className={"grid grid-cols-1 md:grid-cols-2 gap-6"}>
      {/* <StampHolders holders={holders} /> */}
      <div className={"flex flex-col gap-6"}>
        <div class="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6">
          <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E] overflow-y-auto">
            <div class="flex gap-4 md:gap-8 items-end">
              <p
                class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
                  selectedTab1 === "dispensers"
                    ? "font-bold border-b-4 border-b-[#8800CC]"
                    : ""
                }`}
                onClick={() => setSelectedTab1("dispensers")}
              >
                Dispensers
              </p>
              <p
                class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
                  selectedTab1 === "sales"
                    ? "font-bold border-b-4 border-b-[#8800CC]"
                    : ""
                }`}
                onClick={() => setSelectedTab1("sales")}
              >
                Sales
              </p>
            </div>
          </div>
          {selectedTab1 === "dispensers" && (
            <StampDispensers dispensers={dispensers} />
          )}
          {selectedTab1 === "sales" && (
            <StampSales
              dispenses={dispensesWithRates}
            />
          )}
        </div>
        <div class="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6">
          <div class="flex flex-col-reverse lg:flex-row justify-between w-full border-b border-[#3F2A4E] overflow-y-auto">
            <div class="flex gap-4 md:gap-8 items-end">
              <p
                class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
                  selectedTab2 === "vaults"
                    ? "font-bold border-b-4 border-b-[#8800CC]"
                    : ""
                }`}
                onClick={() => setSelectedTab2("vaults")}
              >
                Vaults
              </p>
              <p
                class={`text-sm md:text-[19px] text-[#8800CC] cursor-pointer pb-4 ${
                  selectedTab2 === "transfers"
                    ? "font-bold border-b-4 border-b-[#8800CC]"
                    : ""
                }`}
                onClick={() => setSelectedTab2("transfers")}
              >
                Transfers
              </p>
            </div>
          </div>
          {selectedTab2 === "vaults" && <StampVaults vaults={[]} />}
          {selectedTab2 === "transfers" && <StampSends sends={sends} />}
        </div>
      </div>
    </div>
  );
}
