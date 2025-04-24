/* ===== SRC20 HEADER COMPONENT ===== */
import { SearchSRC20Modal } from "$islands/modal/SearchSRC20Modal.tsx";
import { titlePurpleLD } from "$text";
import { Button } from "$components/button/ButtonBase.tsx";

/* ===== TYPES ===== */
interface SRC20OverviewHeaderProps {
  onViewTypeChange?: () => void;
  viewType: "minted" | "minting";
}

/* ===== COMPONENT ===== */
export const SRC20OverviewHeader = (
  { onViewTypeChange, viewType }: SRC20OverviewHeaderProps,
) => {
  /* ===== RENDER ===== */
  return (
    <div class="relative flex flex-row justify-between items-start w-full gap-3">
      {/* ===== RESPONSIVE TITLE ===== */}
      <h1 className={`${titlePurpleLD} block mobileLg:hidden`}>TOKENS</h1>
      <h1 className={`${titlePurpleLD} hidden mobileLg:block`}>
        SRC-20 TOKENS
      </h1>

      {/* ===== CONTROLS SECTION ===== */}
      <div className="flex flex-col">
        <div className="flex relative items-start justify-between gap-4 tablet:gap-3">
          <SearchSRC20Modal showButton={true} />
          <Button
            variant={viewType === "minting" ? "flatOutline" : "outlineFlat"}
            color="purple"
            size="sm"
            onClick={onViewTypeChange}
          >
            MINTING
          </Button>
        </div>
      </div>
    </div>
  );
};
