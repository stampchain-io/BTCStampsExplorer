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
      <div className="opacity-0 hover:opacity-100 bg-gradient-from-tr bg-gradient-to-bl from-[#CCCCCC00] via-[#9999997F] to-[#666666FF] absolute inset-0 transition-opacity duration-300" />
    </div>
  );
}

export function PartnersModule() {
  return (
    <div>
      <h2 className="font-black text-3xl md:text-6xl gray-gradient4 mb-3">
        PARTNERS
      </h2>
      <div className="flex justify-between items-center flex-col md:flex-row gap-3 md:gap-6">
        {partners.map((partner) => (
          <PartnerCard key={partner.name} {...partner} />
        ))}
      </div>
    </div>
  );
}
