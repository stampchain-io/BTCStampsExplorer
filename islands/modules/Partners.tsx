import { useState } from "preact/hooks";
import { ModulesStyles } from "$islands/modules/Styles.ts";

interface Partner {
  name: string;
  largeImage: string;
  largeImageHover: string;
  smallImage: string;
  smallImageHover: string;
  url?: string;
}

const partners: Partner[] = [
  {
    name: "Bitfinity",
    largeImage: "/img/home/partner/bitfinity-large.svg",
    largeImageHover: "/img/home/partner/bitfinity-large-hover.svg",
    smallImage: "/img/home/partner/bitfinity-small.svg",
    smallImageHover: "/img/home/partner/bitfinity-small-hover.svg",
    url: "https://bitfinity.network/",
  },
  {
    name: "R8",
    largeImage: "/img/home/partner/r8-large.svg",
    largeImageHover: "/img/home/partner/r8-large-hover.svg",
    smallImage: "/img/home/partner/r8-small.svg",
    smallImageHover: "/img/home/partner/r8-small-hover.svg",
    url: "https://www.revolvedex.com/",
  },
  {
    name: "Bitname",
    largeImage: "/img/home/partner/bitname-large.svg",
    largeImageHover: "/img/home/partner/bitname-large-hover.svg",
    smallImage: "/img/home/partner/bitname-small.svg",
    smallImageHover: "/img/home/partner/bitname-small-hover.svg",
    url: "https://bitname.pro",
  },
];

function PartnerCard(
  { name, largeImage, largeImageHover, smallImage, smallImageHover, url }:
    Partner,
) {
  const [isHovered, setIsHovered] = useState(false);

  const content = (
    <div className="relative w-full">
      {/* Add invisible copy of image to set correct height */}
      <img
        src={largeImage}
        alt=""
        class="hidden mobileMd:block w-full invisible p-[6px]"
      />
      <img
        src={smallImage}
        alt=""
        class="block mobileMd:hidden w-full invisible p-[6px]"
      />

      {/* Overlay elements */}
      {isHovered && <div className="blur bg-white/50 absolute inset-0" />}
      <img
        src={isHovered ? largeImageHover : largeImage}
        alt={`${name} banner`}
        loading="lazy"
        class="hidden mobileMd:block absolute inset-0 cursor-pointer transition-all duration-300 w-full p-[6px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <img
        src={isHovered ? smallImageHover : smallImage}
        alt={`${name} banner`}
        loading="lazy"
        class="block mobileMd:hidden absolute inset-0 cursor-pointer transition-all duration-300 w-full p-[6px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
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
