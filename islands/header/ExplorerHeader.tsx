/* ===== EXPLORER HEADER COMPONENT ===== */
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
    <div class="flex flex-row justify-between items-start w-full">
      {/* Responsive Title Section */}
      <h1 className={titlePurpleLD}>EXPLORER</h1>

      {/* Controls Section */}
      <div className="flex flex-col">
        <div className="flex relative items-start justify-between gap-4 tablet:gap-3">
          {/* Sort Component */}
          <div>
            <Sort initSort={sortBy} />
          </div>

          {/* Search Component */}
          <div>
            <SearchStampModal showButton />
          </div>
        </div>
      </div>
    </div>
  );
};
