/* ===== COLLECTION LIST CARD COMPONENT ===== */
import { Collection } from "$globals";
import { useState } from "preact/hooks";

/* ===== STYLES ===== */
const containerClassName =
  `border-2 border-stamp-grey-darker rounded-md relative overflow-hidden
  w-full h-[92px] mobileMd:h-[116px] mobileLg:h-[130px] tablet:h-[148px] desktop:h-[160px]`;
const imageContentClassName =
  "bg-center bg-no-repeat bg-[length:100%] w-full h-full grayscale transition-all duration-300";
const gradientContentClassName =
  "w-full h-full bg-gradient-to-tr absolute left-0 top-0";
const nameClassName = `hidden mobileLg:block
  text-xl desktop:text-2xl font-black uppercase
  absolute mobileLg:left-[14px] mobileLg:bottom-[9px] tablet:left-3 tablet:bottom-[6px] desktop:left-[18px] desktop:bottom-3
`;

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
