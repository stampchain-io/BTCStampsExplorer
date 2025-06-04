import { BadgeIcon, Icon } from "$components/icon/IconBase.tsx";

// Define the filter types
export type FilterType = "stamp" | "src20" | "explorer";

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
        size="custom"
        color="purple"
        className="mt-[6px] w-[23px] h-[23px] tablet:w-[21px] tablet:h-[21px] group-hover:fill-stamp-purple-bright transition-all duration-300"
        onClick={() => setOpen(!open)}
        data-drawer-target={drawerTarget}
        data-drawer-show={drawerTarget}
        aria-controls={drawerTarget}
      />
    </div>
  );
}
