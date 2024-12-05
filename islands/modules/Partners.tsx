import { useState } from "preact/hooks";
import { ModulesStyles } from "$islands/modules/Styles.ts";

interface Partner {
  name: string;
  largeImage: string;
  smallImage: string;
  url?: string;
}

const partners: Partner[] = [
  {
    name: "Bitfinity",
    largeImage: "/img/home/partner/bitfinity-partnercard-large.png",
    smallImage: "/img/home/partner/bitfinity-partnercard-small.png",
    url: "https://bitfinity.network/",
  },
  {
    name: "R8",
    largeImage: "/img/home/partner/r8-partnercard-large.png",
    smallImage: "/img/home/partner/r8-partnercard-small.png",
    url: "https://www.revolvedex.com/",
  },
  {
    name: "Bitname",
    largeImage: "/img/home/partner/bitname-partnercard-large.png",
    smallImage: "/img/home/partner/bitname-partnercard-small.png",
    url: "https://bitname.pro",
  },
];

function PartnerCard({ name, largeImage, smallImage, url }: Partner) {
  const [isHovered, setIsHovered] = useState(false);

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
      {/* Invisible images for sizing */}
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

      {/* Actual display images */}
      <img
        src={largeImage}
        alt={`${name} banner`}
        loading="lazy"
        class={`hidden mobileMd:block absolute inset-0 w-full cursor-pointer transition-all duration-300 ${
          isHovered ? "grayscale-0" : "grayscale"
        }`}
      />
      <img
        src={smallImage}
        alt={`${name} banner`}
        loading="lazy"
        class={`block mobileMd:hidden absolute inset-0 w-full cursor-pointer transition-all duration-300 ${
          isHovered ? "grayscale-0" : "grayscale"
        }`}
      />

      {/* Gradient overlay */}
      <div
        class={`w-full h-full bg-gradient-to-tr from-[#666666FF] via-[#9999997F] to-[#CCCCCC00] absolute left-0 top-0 transition-opacity duration-300 ${
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

export function PartnersModule() {
  return (
    <div class="flex flex-col max-w-desktop w-full mx-auto">
      <h2 className={ModulesStyles.subTitleGrey}>PARTNERS</h2>
      <div class="grid grid-cols-3 -m-[6px] gap-[6px] mobileMd:gap-[18px] desktop:gap-[30px]">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} {...partner} />
        ))}
      </div>
    </div>
  );
}
