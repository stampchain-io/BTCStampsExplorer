import { useEffect, useState } from "preact/hooks";
import { Icon } from "$icon";

interface SettingProps {
  initFilter: string[];
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: string[];
  onFilterClick?: (filter: string) => void;
}

export function Setting({
  initFilter = [],
  open = false,
  handleOpen,
  filterButtons,
  onFilterClick,
}: SettingProps) {
  const [visible, setVisible] = useState<boolean>(false);
  const [localFilters, setLocalFilters] = useState<string[]>(initFilter);

  useEffect(() => {
    setLocalFilters(initFilter);
  }, [initFilter]);

  const handleFilterClick = (filter: string) => {
    if (onFilterClick) {
      onFilterClick(filter);
    }
    handleOpen(false);
  };

  return (
    <div
      class={`rounded-md flex flex-col items-center gap-1 h-fit relative z-[10] ${
        open ? "px-6 py-4 border-2 border-stamp-purple bg-[#0B0B0B]" : ""
      }`}
    >
      {open
        ? (
          <>
            <img
              class="cursor-pointer absolute top-5 right-2"
              src="/img/stamp/navigator-close.png"
              alt="Navigator close"
              onClick={() => handleOpen(false)}
            />
            <p className="text-lg font-black text-[#AA00FF] mb-1">TOOLS</p>
            {filterButtons.map((filter) => (
              <button
                key={filter}
                type="button"
                class={`cursor-pointer text-xs tablet:text-sm font-black ${
                  localFilters.includes(filter)
                    ? "text-stamp-purple-bright "
                    : "text-stamp-purple hover:text-stamp-purple-bright"
                }`}
                onClick={() => handleFilterClick(filter)}
              >
                {filter.toUpperCase()}
              </button>
            ))}
          </>
        )
        : (
          <Icon
            type="iconLink"
            name="gear"
            weight="bold"
            size="custom"
            color="purple"
            className="mt-[5px] w-[26px] h-[26px] tablet:w-[24px] tablet:h-[24px] transform transition-all duration-300"
            ariaLabel="Settings"
            onClick={() => handleOpen(true)}
            onMouseEnter={() => setVisible(true)}
            onMouseLeave={() => setVisible(false)}
          />
        )}
      {visible && (
        <div
          role="tooltip"
          className="absolute bottom-full right-[0.3px] mb-2 z-10 px-3 py-2 text-sm font-medium text-white bg-stamp-bg-grey-darkest rounded-lg shadow-md"
        >
          Settings
          <div className="tooltip-arrow" />
        </div>
      )}
    </div>
  );
}
