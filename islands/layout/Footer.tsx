interface FooterLink {
  title: string;
  href: string;
  isExternal?: boolean;
}

const resourcesStampLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "DONATE", href: "#" },
  { title: "CONTACT", href: "#" },
  { title: "TERMS OF SERVICE", href: "/termsofservice" },
];

const stapmChainLinks: FooterLink[] = [
  { title: "FAQ", href: "/faq" },
  { title: "HOW-TO", href: "#" },
  {
    title: "MEDIA",
    href: "https://github.com/stampchain-io/",
    isExternal: true,
  },
  { title: "PRESS KIT", href: "/presskit" },
];

const socialLinks = [
  { href: "#", icon: "/img/footer/EnvelopeSimple.png" },
  { href: "https://x.com/Stampchain", icon: "/img/footer/XLogo.png" },
  { href: "https://t.me/BitcoinStamps", icon: "/img/footer/TelegramLogo.png" },
  { href: "https://discord.gg/PCZU6xrt", icon: "/img/footer/DiscordLogo.png" },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.png",
  },
];

export function Footer() {
  return (
    <footer className="px-3 md:px-6 xl:px-12 py-6 sm:py-9 md:py-[72px] text-[#8800CC] font-medium max-w-[1440px] w-full mx-auto flex flex-col lg:flex-row justify-between gap-4 text-sm md:text-lg">
      <div className="w-full flex flex-col gap-1 items-center md:items-start">
        <p className="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#7700BB] to-[#AA00FF] text-3xl md:text-6xl italic font-black">
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className="text-xs md:text-xl font-light mb-2 md:mb-0">
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex gap-6">
          {socialLinks.map((link) => (
            <a key={link.href} href={link.href} target="_blank">
              <img src={link.icon} className="w-11 h-10" alt="" />
            </a>
          ))}
        </div>
      </div>

      <div className="flex justify-end lg:justify-between w-full">
        <div className="hidden lg:flex flex-col gap-1">
          <p className="text-lg font-black">RESOURCES</p>
          {resourcesStampLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              f-partial={link.href}
              className="leading-4 hover:text-[#AA00FF]"
            >
              {link.title}
            </a>
          ))}
        </div>

        <div className="text-right flex flex-col items-center lg:items-end gap-6 lg:gap-1 w-full lg:w-auto">
          <p className="text-lg font-black hidden lg:block">
            STAMPCHAIN
          </p>
          <div className="flex flex-row lg:flex-col justify-between w-full max-w-[320px] gap-1 leading-4">
            {stapmChainLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className={`hover:text-[#AA00FF] ${
                  link.title === "STAMPCHAIN"
                    ? "hidden md:block"
                    : link.title === "TERMS OF SERVICE"
                    ? "hidden md:block"
                    : ""
                }`}
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title === "STAMPCHAIN" && globalThis.innerWidth < 768
                  ? "ABOUT"
                  : link.title}
              </a>
            ))}
          </div>
          <div className="flex gap-6">
            <a href="#" className="text-[#440066]">
              <span className="italic">STAMPCHAIN</span> @ 2024
            </a>
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className="block md:hidden hover:text-[#AA00FF]"
            >
              TERMS OF SERVICE
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
