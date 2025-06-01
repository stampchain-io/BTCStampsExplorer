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
    <div class="group">
      <BadgeIcon text={count !== undefined ? count.toString() : ""} />
      <Icon
        type="iconLink"
        name="filter"
        weight="bold"
        size="sm"
        color="purple"
        className="mt-[5px] group-hover:fill-stamp-purple-bright transition-all duration-300"
        onClick={() => setOpen(!open)}
        data-drawer-target={drawerTarget}
        data-drawer-show={drawerTarget}
        aria-controls={drawerTarget}
      />
    </div>
  );
}
