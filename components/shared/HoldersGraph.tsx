import PieChart from "$components/shared/PieChart.tsx";

import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

interface Holder {
  address: string | null;
  quantity: number;
  amt: number;
  percentage: number;
}

interface HoldersGraphProps {
  holders?: Holder[];
}

const tableHeaders = [
  { key: "address", label: "Address" },
  { key: "amount", label: "Amount" },
  { key: "percent", label: "Percent" },
];

function HolderRow(
  { holder }: { holder: Holder },
) {
  return (
    <tr>
      <td class="pr-3 tablet:pr-6 py-2 tablet:py-4">
        <a href={`/wallet/${holder.address}`}>
          {holder.address ? abbreviateAddress(holder.address) : "Unknown"}
        </a>
      </td>
      <td class="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {holder.amt}
      </td>
      <td class="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {holder.percentage}%
      </td>
    </tr>
  );
}

export function HoldersGraph(
  { holders = [] }: HoldersGraphProps,
) {
  if (!holders.length) {
    return (
      <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
        <div class="text-center py-10">No holder data available</div>
      </div>
    );
  }

  const totalHolders = holders.length;

  return (
    <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
      <div class="absolute top-6 right-6 text-center">
        <p class="text-stamp-text-secondary font-light uppercase">
          HOLDERS
        </p>
        <p class="text-stamp-text-primary font-light uppercase tablet:text-[32px]">
          {totalHolders}
        </p>
      </div>
      <div class="flex flex-col items-center tablet:flex-row w-full gap-6">
        <div class="mt-5 tablet:mt-0">
          <PieChart holders={holders} />
        </div>
        <div class="relative shadow-md w-full max-w-full mt-6 tablet:mt-20">
          <div class="max-h-96 overflow-x-auto">
            <table class="w-full text-sm text-left rtl:text-right text-stamp-text-secondary mobileLg:rounded-lg">
              <thead class="text-lg uppercase">
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      class={`${
                        key === "address"
                          ? "pr-3 tablet:pr-6"
                          : key === "percent"
                          ? "pl-3 tablet:pl-6"
                          : "px-3 tablet:px-6"
                      } py-1 tablet:py-3 font-light`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {holders.map((holder, index) => (
                  <HolderRow
                    key={index}
                    holder={holder}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
