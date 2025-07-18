import { HoldersPieChart, HoldersTableBase } from "$table";
import { containerBackground } from "$layout";
import { labelSm, value3xl } from "$text";

interface Holder {
  address?: string;
  amt: string;
  percentage: string;
}

interface HoldersTableProps {
  holders?: Holder[];
}

export function HoldersTable({ holders = [] }: HoldersTableProps) {
  if (!holders.length) {
    return (
      <div class="flex flex-col bg-gradient-to-br primary-gradient p-6 relative rounded-lg">
        <div class="text-center py-10">No holder data available</div>
      </div>
    );
  }

  const totalHolders = holders.length;

  return (
    <div class={containerBackground}>
      <div class="text-left tablet:text-right">
        <h5 class={labelSm}>HOLDERS</h5>
        <h6 class={value3xl}>
          {totalHolders}
        </h6>
      </div>
      <div class="flex flex-col tablet:flex-row w-full gap-6">
        <div class="flex justify-center tablet:justify-start">
          <HoldersPieChart holders={holders as any} />
        </div>

        <div class="relative w-full max-w-full">
          <HoldersTableBase holders={holders as any} />
        </div>
      </div>
    </div>
  );
}
