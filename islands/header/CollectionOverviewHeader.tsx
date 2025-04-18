/* ===== COLLECTION OVERVIEW HEADER COMPONENT ===== */
import { StampSearchClient } from "$search";
import { titlePurpleLD } from "$text";

/* ===== COMPONENT ===== */
function CollectionOverviewHeader() {
  return (
    <div class="flex justify-between items-center w-full">
      <h1 className={titlePurpleLD}>
        COLLECTIONS
      </h1>
      <StampSearchClient showButton={true} />
    </div>
  );
}

export { CollectionOverviewHeader };
