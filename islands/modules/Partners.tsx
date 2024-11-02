interface Partner {
  name: string;
  imageSrc: string;
}

const partners: Partner[] = [
  { name: "Bitfinity", imageSrc: "/img/home/partner-bitfinity-banner.svg" },
  { name: "R8", imageSrc: "/img/home/partner-r8-banner.svg" },
  { name: "Bitname", imageSrc: "/img/home/partner-bitname-banner.svg" },
];

function PartnerCard({ imageSrc, name }: Partner) {
  return (
    <div className="relative cursor-pointer">
      <img src={imageSrc} alt={`${name} banner`} loading="lazy" />
      <div className="opacity-100 hover:opacity-0 bg-gradient-from-tr bg-gradient-to-bl from-[#CCCCCC00] via-[#9999997F] to-[#666666FF] absolute inset-0 transition-opacity duration-300" />
    </div>
  );
}

export function PartnersModule() {
  return (
    <div class="
      flex flex-col gap-4
      px-3 tablet:px-6 desktop:px-12 
      max-w-desktop w-full mx-auto
    ">
      <h2 class="font-black text-3xl tablet:text-6xl gray-gradient4 mb-3">
        PARTNERS
      </h2>
      <div className="flex justify-between items-center flex-col tablet:flex-row gap-3 tablet:gap-6">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} {...partner} />
        ))}
      </div>
    </div>
  );
}
