import { HoldersPieChart } from "$islands/charts/HoldersPieChart.tsx";
import { abbreviateAddress } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import {
  cellAlign,
  colGroup,
  dataLabel,
  dataValueXL,
  row,
  tableLabel,
  tableValue,
  tableValueLink,
} from "$components/shared/TableStyles.ts";

interface Holder {
  address: string | null;
  amt: number;
  percentage: number;
}

interface HoldersGraphProps {
  holders?: Holder[];
}

export function HoldersGraph({ holders = [] }: HoldersGraphProps) {
  const headers = ["ADDRESS", "AMOUNT", "PERCENT"];

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
        <p className={`${dataValueXL} text-stamp-grey-light`}>
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col tablet:flex-row w-full gap-6">
        <div className="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders} />
        </div>

        <div className="relative w-full max-w-full">
          <ScrollContainer class="h-48 mobileLg:h-64 mt-3 mobileMd:mt-6">
            <table className={tableValue}>
              <colgroup>
                {colGroup([
                  { width: "w-[50%]" },
                  { width: "w-[25%]" },
                  { width: "w-[25%]" },
                ]).map((col) => (
                  <col
                    key={col.key}
                    className={col.className}
                  />
                ))}
              </colgroup>
              <thead>
                <tr>
                  {headers.map((header, i) => (
                    <th
                      key={i}
                      scope="col"
                      class={`${tableLabel} ${cellAlign(i, headers.length)}`}
                    >
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className={tableValue}>
                {holders.map((holder, index) => {
                  if (!holder.address) {
                    return (
                      <tr className={row}>
                        <td class={cellAlign(0, headers.length)}>UNKNOWN</td>
                        <td class={cellAlign(1, headers.length)}>
                          {holder.amt}
                        </td>
                        <td class={cellAlign(2, headers.length)}>
                          {holder.percentage}%
                        </td>
                      </tr>
                    );
                  }

                  return (
                    <tr key={index} className={row}>
                      <td class={cellAlign(0, headers.length)}>
                        <a
                          target="_top"
                          href={`/wallet/${holder.address}`}
                          className={tableValueLink}
                        >
                          <span className="mobileLg:hidden">
                            {abbreviateAddress(holder.address, 8)}
                          </span>
                          <span className="hidden mobileLg:inline">
                            {holder.address}
                          </span>
                        </a>
                      </td>
                      <td class={cellAlign(1, headers.length)}>
                        {holder.amt}
                      </td>
                      <td class={cellAlign(2, headers.length)}>
                        {holder.percentage}%
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </ScrollContainer>
        </div>
      </div>
    </div>
  );
}
