import { Collection } from "globals";

const containerClassName =
  "border-2 border-stamp-grey-darker rounded-md relative w-full h-[67px] mobileLg:h-[145px] tablet:h-[122px] desktop:h-[180px]";
const imageContentClassName =
  "bg-center bg-no-repeat bg-[length:100%] w-full h-full";
const gradientContentClassName =
  "w-full h-full bg-gradient-to-r absolute left-0 top-0";
const nameClassName =
  "hidden mobileLg:block text-xl desktop:text-2xl font-black absolute mobileLg:left-[14px] mobileLg:bottom-[9px] tablet:left-3 tablet:bottom-[6px] desktop:left-[18px] desktop:bottom-3";
interface CollectionListCardProps {
  collection: Collection;
  isDarkMode: boolean;
}
export function CollectionListCard(
  { collection, isDarkMode }: CollectionListCardProps,
) {
  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      class={containerClassName}
    >
      <div
        class={imageContentClassName}
        style={{ backgroundImage: `url('${collection.first_stamp_image}')` }}
      >
      </div>
      <div
        class={gradientContentClassName + " " +
          (isDarkMode
            ? "from-[#666666] via-[#999999] to-[#CCCCCC]"
            : "from-[#CCCCCC] via-[#999999] to-[#666666]")}
      />
      <h3
        class={nameClassName + " " +
          (isDarkMode ? "text-stamp-grey-light" : "text-stamp-grey-darkest")}
      >
        {collection.collection_name}
      </h3>
    </a>
  );
}
