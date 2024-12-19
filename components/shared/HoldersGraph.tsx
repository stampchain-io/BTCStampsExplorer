import { HoldersPieChart } from "../../islands/charts/HoldersPieChart.tsx";
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

function HolderRow({ holder }: { holder: Holder }) {
  return (
    <tr>
      <td class="text-left py-0">
        <a
          href={`/wallet/${holder.address}`}
          data-tooltip-target={holder.address || "Unknown"}
          title={holder.address || "Unknown"}
          class="hover:text-stamp-purple transition-colors"
        >
          {holder.address
            ? (
              <>
                <span class="mobileLg:hidden">
                  {abbreviateAddress(holder.address, 8)}
                </span>
                <span class="hidden mobileLg:inline">
                  {holder.address}
                </span>
              </>
            )
            : "Unknown"}
        </a>
      </td>
      <td class="text-center py-0">
        {holder.amt}
      </td>
      <td class="text-right py-0">
        {holder.percentage}%
      </td>
    </tr>
  );
}

export function HoldersGraph({ holders = [] }: HoldersGraphProps) {
  if (!holders.length) {
    return (
      <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative rounded-lg">
        <div class="text-center py-10">No holder data available</div>
      </div>
    );
  }

  const dataLabelClassName =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXLClassName =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
  const tableLabelClassName =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const tableValueClassName =
    "text-xs mobileLg:text-sm font-normal text-stamp-grey-light";
  const totalHolders = holders.length;

  return (
    <div class="flex flex-col dark-gradient p-3 mobileMd:p-6 relative rounded-lg">
      <div class="text-left tablet:text-right">
        <p class={dataLabelClassName}>HOLDERS</p>
        <p class={dataValueXLClassName}>{totalHolders}</p>
      </div>
      <div class="flex flex-col tablet:flex-row w-full gap-6">
        <div class="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders} />
        </div>

        <div class="relative w-full max-w-full">
          <div class="h-48 mobileLg:h-64 overflow-x-auto overflow-y-auto mt-3 mobileMd:mt-6 scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
            <table class="w-full table-auto border-separate border-spacing-y-2">
              <thead class={tableLabelClassName}>
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      class={`pb-1.5 px-4 ${
                        key === "address"
                          ? "text-left"
                          : key === "percent"
                          ? "text-right"
                          : "text-center"
                      }`}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody class={tableValueClassName}>
                {holders.map((holder, index) => (
                  <HolderRow key={index} holder={holder} />
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
