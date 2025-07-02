import { HoldersPieChart, HoldersTableBase } from "$table";
import { containerBackground } from "$layout";
import { labelSm, value3xl } from "$text";

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
    <div className={containerBackground}>
      <div className="text-left tablet:text-right">
        <h5 className={labelSm}>HOLDERS</h5>
        <h6 className={value3xl}>
          {totalHolders}
        </h6>
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
