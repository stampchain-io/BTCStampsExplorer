/* ===== PARTNERS GALLERY COMPONENT ===== */
import { useState } from "preact/hooks";
import { gapGrid } from "$layout";
import { subtitleGrey } from "$text";

/* ===== TYPES ===== */
interface Partner {
  name: string;
  largeImage: string;
  smallImage: string;
  url?: string;
}

/* ===== PARTNER DATA ===== */
const partners: Partner[] = [
  {
    name: "Bitfinity",
    largeImage: "/img/partner/bitfinity-wide.webp",
    smallImage: "/img/partner/bitfinity-square.webp",
    url: "https://bitfinity.network/",
  },
  {
    name: "R8",
    largeImage: "/img/partner/r8-wide.webp",
    smallImage: "/img/partner/r8-square.webp",
    url: "https://www.revolvedex.com/",
  },
  {
    name: "Bitname",
    largeImage: "/img/partner/bitname-wide.webp",
    smallImage: "/img/partner/bitname-square.webp",
    url: "https://bitname.pro",
  },
];

/* ===== PARTNER CARD COMPONENT ===== */
function PartnerCard({ name, largeImage, smallImage, url }: Partner) {
  /* ===== STATE ===== */
  const [isHovered, setIsHovered] = useState(false);

  /* ===== RENDER ===== */
  const content = (
    <div
      class={`relative w-full border-2 ${
        isHovered
          ? "border-stamp-grey shadow-collection"
          : "border-stamp-grey-darker"
      } rounded-md`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ===== SIZING IMAGES ===== */}
      <img
        src={largeImage}
        alt=""
        class="hidden mobileMd:block w-full invisible"
      />
      <img
        src={smallImage}
        alt=""
        class="block mobileMd:hidden w-full invisible"
      />

      {/* ===== DISPLAY IMAGES ===== */}
      <img
        src={largeImage}
        alt={`${name} banner`}
        loading="lazy"
        class={`hidden mobileMd:block absolute inset-0 w-full cursor-pointer transition-all duration-150 ${
          isHovered ? "grayscale-0" : "grayscale"
        }`}
      />
      <img
        src={smallImage}
        alt={`${name} banner`}
        loading="lazy"
        class={`block mobileMd:hidden absolute inset-0 w-full cursor-pointer transition-all duration-150 ${
          isHovered ? "grayscale-0" : "grayscale"
        }`}
      />

      {/* ===== GRADIENT OVERLAY ===== */}
      <div
        class={`w-full h-full bg-gradient-to-tr from-[#666666FF] via-[#9999997F] to-[#CCCCCC00] absolute left-0 top-0 transition-opacity duration-150 ${
          isHovered ? "!hidden" : ""
        }`}
      />
    </div>
  );

  return url
    ? (
      <a href={url} target="_blank" rel="noopener noreferrer">
        {content}
      </a>
    )
    : content;
}

/* ===== COMPONENT ===== */
export function PartnersBanner() {
  /* ===== RENDER ===== */
  return (
    <div class="flex flex-col max-w-desktop w-full mx-auto mb-4">
      {/* ===== TITLE SECTION ===== */}
      <h2 className={`${subtitleGrey} !mb-2`}>PARTNERS</h2>
      {/* ===== BANNER CARDS SECTION ===== */}
      <div className={`grid grid-cols-3 pt-2 ${gapGrid}`}>
        {partners.map((partner) => (
          <PartnerCard key={partner.name} {...partner} />
        ))}
      </div>
    </div>
  );
}
