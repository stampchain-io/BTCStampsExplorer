/* ===== COLLECTION OVERVIEW HEADER COMPONENT ===== */
import { SortButton } from "$islands/button/SortButton.tsx";
import { container2Icon } from "$layout";
import { titlePrimary } from "$text";

/* ===== COMPONENT ===== */
function CollectionOverviewHeader(
  { sortBy = "ASC" }: { sortBy?: "ASC" | "DESC" },
) {
  return (
    <div class="flex flex-row justify-between items-start w-full mb-2">
      <h1 class={titlePrimary}>
        COLLECTIONS
      </h1>
      <div class={container2Icon}>
        <SortButton initSort={sortBy} />
      </div>
    </div>
  );
}

export { CollectionOverviewHeader };
