import { HoldersPieChart } from "../../islands/charts/HoldersPieChart.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "./ScrollContainer.tsx";

interface Holder {
  address: string | null;
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

const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
const dataValueXL =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
const row = "h-8 hover:bg-stamp-purple/10";

function HolderRow({ holder }: { holder: Holder }) {
  const handleClick = (e: MouseEvent, address: string) => {
    e.preventDefault();
    globalThis.location.href = `/wallet/${address}`;
  };

  return (
    <tr className={row}>
      <td className="text-left">
        {holder.address
          ? (
            <a
              href={`/wallet/${holder.address}`}
              onClick={(e) => handleClick(e, holder.address)}
              className="hover:text-stamp-purple-bright cursor-pointer"
            >
              <span className="mobileLg:hidden">
                {abbreviateAddress(holder.address, 8)}
              </span>
              <span className="hidden mobileLg:inline">
                {holder.address}
              </span>
            </a>
          )
          : (
            "Unknown"
          )}
      </td>
      <td className="text-center">
        {holder.amt}
      </td>
      <td className="text-right">
        {holder.percentage}%
      </td>
    </tr>
  );
}

export function HoldersGraph({ holders = [] }: HoldersGraphProps) {
  if (!holders.length) {
    return (
      <div className="flex flex-col bg-gradient-to-br primary-gradient p-6 relative rounded-lg">
        <div className="text-center py-10">No holder data available</div>
      </div>
    );
  }

  const totalHolders = holders.length;

  return (
    <div className="flex flex-col dark-gradient p-3 mobileMd:p-6 relative rounded-md">
      <div className="text-left tablet:text-right">
        <p className={dataLabel}>HOLDERS</p>
        <p className={dataValueXL}>{totalHolders}</p>
      </div>
      <div className="flex flex-col tablet:flex-row w-full gap-6">
        <div className="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders} />
        </div>

        <div className="relative w-full max-w-full">
          <ScrollContainer class="h-48 mobileLg:h-64 mt-3 mobileMd:mt-6">
            <table className={`${tableValue} table-auto`}>
              <thead className={tableLabel}>
                <tr>
                  {tableHeaders.map(({ key, label }) => (
                    <th
                      key={key}
                      scope="col"
                      class={`${tableLabel} pb-1.5 ${
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
              <tbody className={tableValue}>
                {holders.map((holder, index) => (
                  <HolderRow key={index} holder={holder} />
                ))}
              </tbody>
            </table>
          </ScrollContainer>
        </div>
      </div>
    </div>
  );
}
