/* ===== COLLECTION OVERVIEW HEADER COMPONENT ===== */
import { titleGreyLD } from "$text";

/* ===== COMPONENT ===== */
function CollectionOverviewHeader() {
  return (
    <div class="flex flex-row justify-between items-start w-full">
      <h1 class={titleGreyLD}>
        COLLECTIONS
      </h1>
    </div>
  );
}

export { CollectionOverviewHeader };
