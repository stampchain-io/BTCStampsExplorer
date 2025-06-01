import { BadgeIcon, Icon } from "$components/icon/IconBase.tsx";

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
      <BadgeIcon text={count !== undefined ? count.toString() : ""} />
      <Icon
        type="iconLink"
        name="filter"
        weight="bold"
        size="xs"
        color="purple"
        className="mt-1.5 w-[22px] h-[22px]"
        onClick={() => setOpen(!open)}
        data-drawer-target={drawerTarget}
        data-drawer-show={drawerTarget}
        aria-controls={drawerTarget}
      />
    </div>
  );
}
