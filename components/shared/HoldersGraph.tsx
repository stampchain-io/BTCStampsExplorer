import { HoldersPieChart } from "$islands/charts/HoldersPieChart.tsx";
import { dataLabel, dataValueXL } from "$components/shared/TableStyles.ts";
import SRC20HolderTable from "$islands/src20/details/SRC20HolderTable.tsx";

interface Holder {
  address: string | null;
  amt: number;
  percentage: number;
}

interface HoldersGraphProps {
  holders?: Holder[];
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
        <p className={`${dataValueXL} text-stamp-grey-light`}>
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col tablet:flex-row w-full gap-6">
        <div className="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders} />
        </div>

        <div className="relative w-full max-w-full">
          <SRC20HolderTable holders={holders} />
        </div>
      </div>
    </div>
  );
}
