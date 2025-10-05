/* ===== PARTNERS GALLERY COMPONENT ===== */
import { containerBackground, shadowGlowGrey } from "$layout";
import { subtitleGrey } from "$text";
import { useState } from "preact/hooks";

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
      class={`relative w-full border-[1px] ${
        isHovered
          ? `border-stamp-grey ${shadowGlowGrey}`
          : "border-stamp-grey-darker"
      } rounded-2xl`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ===== SIZING IMAGES ===== */}
      <img
        src={largeImage}
        alt=""
        class="hidden mobileMd:block w-full invisible rounded-2xl"
      />
      <img
        src={smallImage}
        alt=""
        class="block mobileMd:hidden w-full invisible rounded-2xl"
      />

      {/* ===== DISPLAY IMAGES ===== */}
      <img
        src={largeImage}
        alt={`${name} banner`}
        loading="lazy"
        class={`hidden mobileMd:block absolute inset-0 w-full cursor-pointer transition-all duration-50 rounded-2xl ${
          isHovered ? "grayscale-0" : "grayscale"
        }`}
      />
      <img
        src={smallImage}
        alt={`${name} banner`}
        loading="lazy"
        class={`block mobileMd:hidden absolute inset-0 w-full cursor-pointer transition-all duration-50 rounded-2xl ${
          isHovered ? "grayscale-0" : "grayscale"
        }`}
      />

      {/* ===== GRADIENT OVERLAY ===== */}
      <div
        class={`w-full h-full bg-gradient-to-tr from-[#666666FF] via-[#9999997F] to-[#CCCCCC00] absolute left-0 top-0 transition-opacity duration-50 rounded-2xl ${
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
    <section class={containerBackground}>
      <div class="flex flex-col max-w-desktop w-full mx-auto">
        {/* ===== TITLE SECTION ===== */}
        <h2 class={`${subtitleGrey} !mb-2`}>PARTNERS</h2>
        {/* ===== BANNER CARDS SECTION ===== */}
        <div class={`grid grid-cols-3 gap-5`}>
          {partners.map((partner) => (
            <PartnerCard key={partner.name} {...partner} />
          ))}
        </div>
      </div>
    </section>
  );
}
