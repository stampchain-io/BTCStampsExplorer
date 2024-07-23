import { CollectionDetailsHeader } from "$islands/collection/CollectionDetailsHeader.tsx";
import { CollectionDetailsContent } from "$islands/collection/CollectionDetailsContent.tsx";

export default function Collection() {
  return (
    <div class="flex flex-col gap-8">
      <CollectionDetailsHeader />
      <CollectionDetailsContent />
    </div>
  );
}
