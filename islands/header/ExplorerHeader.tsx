/* ===== EXPLORER HEADER COMPONENT ===== */
/* TODO (@baba) - update filter and styling */
import { Sort } from "$islands/datacontrol/Sort.tsx";
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { titlePurpleLD } from "$text";

/* ===== TYPES ===== */
type ExplorerHeaderProps = {
  sortBy: "ASC" | "DESC" | undefined;
};

/* ===== COMPONENT ===== */
export const ExplorerHeader = (
  { sortBy }: ExplorerHeaderProps,
) => {
  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      {/* Responsive Title Section */}
      <h1 className={titlePurpleLD}>EXPLORER</h1>

      {/* Controls Section */}
      <div className="flex flex-col">
        <div className="flex relative items-start justify-between gap-3 tablet:gap-1">
          {/* Sort Component */}
          <div>
            <Sort initSort={sortBy} />
          </div>

          {/* Search Component */}
          <div>
            <SearchStampModal showButton={true} />
          </div>
        </div>
      </div>
    </div>
  );
};
