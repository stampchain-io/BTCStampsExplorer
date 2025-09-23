/* ===== COLLECTION OVERVIEW HEADER COMPONENT ===== */
import { titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
function CollectionOverviewHeader() {
  return (
    <div class="flex flex-row justify-between items-start w-full">
      <h1 class={titlePurpleLD}>
        COLLECTIONS
      </h1>
      {/* Search moved to global header */}
    </div>
  );
}

export { CollectionOverviewHeader };
