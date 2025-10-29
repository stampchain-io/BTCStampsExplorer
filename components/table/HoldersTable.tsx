/* ===== HOLDERS TABLE COMPONENT ===== */
import { containerBackground } from "$layout";
import { HoldersPieChart, HoldersTableBase } from "$table";
import { labelSm, value3xl, valueDarkSm } from "$text";
import type { HoldersTableProps } from "$types/ui.d.ts";

/* ===== COMPONENT ===== */
export function HoldersTable({ holders = [] }: HoldersTableProps) {
  /* ===== EMPTY STATE ===== */
  if (!holders?.length) {
    return (
      <div class={containerBackground}>
        <div class="text-center py-10">NO HOLDER DATA AVAILABLE</div>
      </div>
    );
  }

  /* ===== CALCULATIONS ===== */
  const totalHolders = holders?.length ?? 0;

  /* ===== RENDER ===== */
  return (
    <div class={containerBackground}>
      {/* ===== HEADER SECTION ===== */}
      <div class="text-left tablet:text-right">
        <h5 class={labelSm}>HOLDERS</h5>
        <h6 class={value3xl}>
          {totalHolders}
        </h6>
      </div>
      {/* ===== CONTENT SECTION ===== */}
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
