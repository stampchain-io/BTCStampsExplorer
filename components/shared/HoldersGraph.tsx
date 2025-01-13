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
  { key: "address", label: "Address", width: "w-[50%]", align: "text-left" },
  { key: "amount", label: "Amount", width: "w-[25%]", align: "text-center" },
  { key: "percent", label: "Percent", width: "w-[25%]", align: "text-right" },
];

const dataLabel =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";
const dataValueXL =
  "text-3xl mobileLg:text-4xl font-black text-stamp-grey-light -mt-1";
const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";
const row = "h-8 hover:bg-stamp-purple/10 group cursor-pointer";

function HolderRow({ holder }: { holder: Holder }) {
  if (!holder.address) {
    return (
      <tr className={row}>
        <td className="text-left">Unknown</td>
        <td className="text-center">{holder.amt}</td>
        <td className="text-right">{holder.percentage}%</td>
      </tr>
    );
  }

  return (
    <tr className={row}>
      <td colSpan={3} className="p-0">
        <a
          href={`/wallet/${holder.address}`}
          className="flex w-full"
        >
          <span className="w-[50%] text-left group-hover:text-stamp-purple-bright">
            <span className="mobileLg:hidden">
              {abbreviateAddress(holder.address, 8)}
            </span>
            <span className="hidden mobileLg:inline">
              {holder.address}
            </span>
          </span>
          <span className="w-[25%] text-center">{holder.amt}</span>
          <span className="w-[25%] text-right">{holder.percentage}%</span>
        </a>
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
    <div className="relative flex flex-col dark-gradient rounded-lg p-3 mobileMd:p-6">
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
                  {tableHeaders.map(({ key, label, width, align }) => (
                    <th
                      key={key}
                      scope="col"
                      className={`${tableLabel} pb-1.5 ${width} ${align}`}
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
