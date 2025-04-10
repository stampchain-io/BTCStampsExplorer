import { HoldersPieChart } from "$islands/charts/HoldersPieChart.tsx";
import { label, value3xl } from "$text";
import { HoldersTableBase } from "$table";

interface Holder {
  address: string | null;
  amt: number;
  percentage: number;
}

interface HoldersTableProps {
  holders?: Holder[];
}

export function HoldersTable({ holders = [] }: HoldersTableProps) {
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
        <p className={label}>HOLDERS</p>
        <p className={value3xl}>
          {totalHolders}
        </p>
      </div>
      <div className="flex flex-col tablet:flex-row w-full gap-6">
        <div className="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders} />
        </div>

        <div className="relative w-full max-w-full">
          <HoldersTableBase holders={holders} />
        </div>
      </div>
    </div>
  );
}
