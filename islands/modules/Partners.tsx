import { useState } from "preact/hooks";

interface Partner {
  name: string;
  largeImage: string;
  largeImageHover: string;
  smallImage: string;
  smallImageHover: string;
}

const partners: Partner[] = [
  {
    name: "Bitfinity",
    largeImage: "/img/home/partner/bitfinity-large.svg",
    largeImageHover: "/img/home/partner/bitfinity-large-hover.svg",
    smallImage: "/img/home/partner/bitfinity-small.svg",
    smallImageHover: "/img/home/partner/bitfinity-small-hover.svg",
  },
  {
    name: "R8",
    largeImage: "/img/home/partner/r8-large.svg",
    largeImageHover: "/img/home/partner/r8-large-hover.svg",
    smallImage: "/img/home/partner/r8-small.svg",
    smallImageHover: "/img/home/partner/r8-small-hover.svg",
  },
  {
    name: "Bitname",
    largeImage: "/img/home/partner/bitname-large.svg",
    largeImageHover: "/img/home/partner/bitname-large-hover.svg",
    smallImage: "/img/home/partner/bitname-small.svg",
    smallImageHover: "/img/home/partner/bitname-small-hover.svg",
  },
];

function PartnerCard(
  { name, largeImage, largeImageHover, smallImage, smallImageHover }: Partner,
) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="relative w-full">
      {/* Add invisible copy of image to set correct height */}
      <img
        src={largeImage}
        alt=""
        class="hidden mobileLg:block w-full invisible p-[6px]"
      />
      <img
        src={smallImage}
        alt=""
        class="block mobileLg:hidden w-full invisible p-[6px]"
      />

      {/* Overlay elements */}
      {isHovered && <div className="blur bg-white/50 absolute inset-0" />}
      <img
        src={isHovered ? largeImageHover : largeImage}
        alt={`${name} banner`}
        loading="lazy"
        class="hidden mobileLg:block absolute inset-0 cursor-pointer transition-all duration-300 w-full p-[6px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
      <img
        src={isHovered ? smallImageHover : smallImage}
        alt={`${name} banner`}
        loading="lazy"
        class="block mobileLg:hidden absolute inset-0 cursor-pointer transition-all duration-300 w-full p-[6px]"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      />
    </div>
  );
}

export function PartnersModule() {
  return (
    <div class="
      flex flex-col gap-3 mobileLg:gap-6
      max-w-desktop w-full mx-auto
    ">
      <h2 class="font-extralight text-2xl mobileLg:text-4xl desktop:text-5xl text-stamp-grey-light">
        PARTNERS
      </h2>
      <div className="grid grid-cols-3 mobileLg:gap-3">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} {...partner} />
        ))}
      </div>
    </div>
  );
}
