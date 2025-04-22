/* ===== COLLECTION LIST CARD COMPONENT ===== */
import { Collection } from "$globals";
import { useState } from "preact/hooks";

/* ===== STYLES ===== */
const containerClassName =
  `border-2 border-stamp-grey-darker rounded-md relative overflow-hidden
  w-full h-[80px] mobileMd:h-[100px] mobileLg:h-[110px] desktop:h-[120px]`;
const imageContentClassName =
  "bg-center bg-no-repeat bg-[length:100%] w-full h-full grayscale transition-all duration-300";
const gradientContentClassName =
  "w-full h-full bg-gradient-to-tr absolute left-0 top-0";
const nameClassName =
  `hidden mobileMd:block absolute mobileMd:left-3 mobileMd:bottom-1 tablet:left-3 tablet:bottom-1 desktop:left-3 desktop:bottom-1
  font-black text-base mobileLg:text-lg uppercase`;

/* ===== TYPES ===== */
interface CollectionsBannerProps {
  collection: Collection;
  isDarkMode: boolean;
}

/* ===== COMPONENT ===== */
export function CollectionsBanner(
  { collection, isDarkMode }: CollectionsBannerProps,
) {
  /* ===== STATE ===== */
  const [isHovered, setIsHovered] = useState(false);

  /* ===== COMPONENT ===== */
  return (
    <a
      href={`/collection/details/${collection.collection_name}`}
      class={`${containerClassName} ${isHovered ? "shadow-collection" : ""}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div
        class={`${imageContentClassName} ${isHovered ? "grayscale-0" : ""}`}
        style={{
          backgroundImage: `url('${
            collection.first_stamp_image || collection.img
          }')`,
        }}
      >
      </div>
      <div
        class={`${gradientContentClassName} ${
          isDarkMode
            ? "from-[#666666FF] via-[#9999997F] to-[#CCCCCC00]"
            : "from-[#CCCCCCFF] via-[#9999997F] to-[#66666600]"
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
