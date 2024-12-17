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

function HolderRow(
  { holder }: { holder: Holder },
) {
  return (
    <tr>
      <td className="text-left py-0">
        <a
          href={`/wallet/${holder.address}`}
          data-tooltip-target={holder.address || "Unknown"}
          title={holder.address || "Unknown"}
        >
          {holder.address
            ? (
              <>
                <span className="mobileLg:hidden">
                  {abbreviateAddress(holder.address, 8)}
                </span>
                <span className="hidden mobileLg:inline">
                  {holder.address}
                </span>
              </>
            )
            : (
              "Unknown"
            )}
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

  const dataLabelClassName =
    "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
  const dataValueXLClassName =
    "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
  const tableLabelClassName =
    "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
  const tableValueClassName =
    "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full table-auto";
  const totalHolders = holders.length;

  return (
    <div className="flex flex-col dark-gradient p-3 mobileMd:p-6 relative">
      <div className="text-left tablet:text-right">
        <p className={dataLabelClassName}>
          HOLDERS
        </p>
        <p className={dataValueXLClassName}>
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col tablet:flex-row w-full gap-6">
        <div className="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders} />
        </div>

        <div className="relative w-full max-w-full">
<<<<<<< HEAD
<<<<<<< HEAD
<<<<<<< HEAD
          <div className="max-h-48 mobileLg:max-h-64 overflow-x-auto overflow-y-auto mt-3 mobileMd:mt-6">
=======
          <div className="max-h-48 mobileLg:max-h-64 overflow-x-auto mt-3 mobileMd:mt-6">
>>>>>>> 00e558a (chore: update button style on mint & fix stamping/stamp page loading & update table for responsive)
=======
          <div className="max-h-46 mobileLg:max-h-64 overflow-x-auto mt-3 mobileMd:mt-6">
>>>>>>> 24b02e1 (chore: change file for updating)
=======
          <div className="max-h-48 mobileLg:max-h-64 overflow-x-auto mt-3 mobileMd:mt-6">
>>>>>>> 71faa52 (chore: update button style on mint & fix stamping/stamp page loading & update table for responsive)
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
