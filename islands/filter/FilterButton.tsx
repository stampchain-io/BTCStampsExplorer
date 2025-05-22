import { Button } from "$components/shared/Button.tsx";
import { BadgeIcon, FilterIcon } from "$islands/filter/FilterComponents.tsx";

// Define the filter types
export type FilterType = "stamp" | "src20" | "src101";

export function FilterButton(
  { count, open, setOpen, type = "stamp" }: {
    count: number;
    open: boolean;
    setOpen: (status: boolean) => void;
    type?: FilterType;
  },
) {
  // Define drawer target based on filter type
  const drawerTarget = `drawer-form-${type}`;

  return (
    <div
      class={`relative flex flex-col items-center gap-1 rounded-md h-fit border-stamp-purple-bright text-stamp-purple-bright group`}
    >
      <BadgeIcon text={count.toString()} />
      <Button
        variant="icon"
        class="transform transition-all duration-300"
        onClick={() => setOpen(!open)}
        icon={<FilterIcon />}
        data-drawer-target={drawerTarget}
        data-drawer-show={drawerTarget}
        aria-controls={drawerTarget}
      />
    </div>
  );
}
