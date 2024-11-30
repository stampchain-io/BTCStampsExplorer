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
      <td className="text-left py-0">
        <a href={`/wallet/${holder.address}`}>
          {holder.address ? abbreviateAddress(holder.address) : "Unknown"}
        </a>
      </td>
      <td className="text-center py-0">
        {holder.amt}
      </td>
      <td className="text-right py-0">
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
      <div className="flex flex-col bg-gradient-to-br primary-gradient p-6 relative">
        <div className="text-center py-10">No holder data available</div>
      </div>
    );
  }

  const tableLabelClassName =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const tableValueClassName =
    "w-full text-xs mobileLg:text-sm text-stamp-grey-light font-normal";
  const totalHolders = holders.length;

  return (
    <div className="flex flex-col bg-gradient-to-br primary-gradient p-0 pt-24 relative">
      <div className="absolute top-6 right-6 text-right">
        <p className="text-base mobileLg:text-lg text-stamp-grey-darker font-light">
          HOLDERS
        </p>
        <p className="text-2xl mobileLg:text-3xl text-stamp-grey-light font-black -mt-1">
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col tablet:flex-row w-full gap-6">
        <div className="mt-6 tablet:-mt-24 flex justify-center tablet:justify-start">
          <PieChart holders={holders} />
        </div>

        <div className="relative w-full max-w-full">
          <div className="max-h-64 overflow-x-auto p-6">
            <table className={tableValueClassName}>
              <thead className={tableLabelClassName}>
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      class={`${tableLabelClassName} pb-1.5 ${
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
              <tbody>
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
