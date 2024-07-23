import { CollectionHeader } from "$islands/collection/CollectionHeader.tsx";
import { CollectionList } from "$islands/collection/CollectionList.tsx";

export default function Collection() {
  return (
    <div class="flex flex-col gap-8">
      <CollectionHeader />
      <CollectionList />
    </div>
  );
}
