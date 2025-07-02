/* ===== COLLECTION OVERVIEW HEADER COMPONENT ===== */
import { SearchStampModal } from "$islands/modal/SearchStampModal.tsx";
import { titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
function CollectionOverviewHeader() {
  return (
    <div class="flex flex-row justify-between items-start w-full">
      <h1 className={titlePurpleLD}>
        COLLECTIONS
      </h1>
      <SearchStampModal showButton />
    </div>
  );
}

export { CollectionOverviewHeader };
