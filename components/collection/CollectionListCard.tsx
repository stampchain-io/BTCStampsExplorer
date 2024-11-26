import { Collection } from "globals";
import { useState } from "preact/hooks";

const containerClassName =
  `border-2 border-stamp-grey-darker rounded-md relative overflow-hidden
  w-full h-[67px] mobileLg:h-[145px] tablet:h-[122px] desktop:h-[180px]`;
const imageContentClassName =
  "bg-center bg-no-repeat bg-[length:100%] w-full h-full";
const gradientContentClassName =
  "w-full h-full bg-gradient-to-tr absolute left-0 top-0";
const nameClassName = `hidden mobileLg:block
  text-xl desktop:text-2xl font-black uppercase
  absolute mobileLg:left-[14px] mobileLg:bottom-[9px] tablet:left-3 tablet:bottom-[6px] desktop:left-[18px] desktop:bottom-3
`;

interface CollectionListCardProps {
  collection: Collection;
  isDarkMode: boolean;
}

export function CollectionListCard(
  { collection, isDarkMode }: CollectionListCardProps,
) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      class={`${containerClassName} ${isHovered ? "shadow-collection" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        class={imageContentClassName}
        style={{ backgroundImage: `url('${collection.first_stamp_image}')` }}
      >
      </div>
      <div
        class={`${gradientContentClassName} ${
          isDarkMode
            ? "from-[#666666FF] via-[#999999BD] to-[#CCCCCC7F]"
            : "from-[#CCCCCCFF] via-[#999999BD] to-[#6666667F]"
        } ${isHovered ? "hidden" : ""}`}
      />
      <h3
        class={`${nameClassName} ${
          isDarkMode ? "text-stamp-grey-light" : "text-stamp-grey-darkest"
        } ${isHovered ? "!hidden" : ""}`}
      >
        {collection.collection_name}
      </h3>
    </a>
  );
}
