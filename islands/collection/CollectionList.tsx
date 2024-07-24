import { CollectionCard } from "$components/collection/CollectionCard.tsx";
import { CollectionCreateButton } from "$islands/collection/CollectionCreateButton.tsx";

export const CollectionList = ({ collections = [] }: {
  collections: CollectionRow[];
}) => {
  return (
    <div name="collections">
      <div class="flex">
        <CollectionCreateButton />
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4 py-6 transition-opacity duration-700 ease-in-out">
        {[...Array(20)].map((collection: CollectionRow) => (
          <CollectionCard collection={collection} />
        ))}
      </div>
    </div>
  );
};
