interface FooterLink {
  title: string;
  href: string;
  isExternal?: boolean;
}

const resourcesStampLinks: FooterLink[] = [
  { title: "FAQ", href: "/faq" },
  { title: "HOW-TO", href: "/howto" },
  {
    title: "MEDIA",
    href: "https://github.com/stampchain-io/",
    isExternal: true,
  },
  {
    title: "PRESS KIT",
    href:
      "https://drive.google.com/drive/folders/18QsMTZ_ZII5FVxuAs2CLFoLdZE3NOdlT",
    isExternal: true,
  },
];

const stapmChainLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "DONATE", href: "#" },
  { title: "CONTACT", href: "#" },
  { title: "TERMS OF SERVICE", href: "/termsofservice" },
];

const socialLinks = [
  { href: "https://x.com/Stampchain", icon: "/img/footer/XLogo.svg" },
  { href: "https://t.me/BitcoinStamps", icon: "/img/footer/TelegramLogo.svg" },
  { href: "https://discord.gg/BRYRt4bH", icon: "/img/footer/DiscordLogo.svg" },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.svg",
  },
];

export function Footer() {
  return (
    <footer className="px-3 md:px-6 xl:px-12 py-6 md:py-[72px] text-[#8800CC] font-medium max-w-[1440px] w-full mx-auto flex flex-col md:flex-row justify-between gap-4 text-sm md:text-lg">
      <div className="w-full flex flex-col gap-1 items-center md:items-start">
        <p className="purple-gradient2 text-[40px] leading-[47px] sm:text-[42px] sm:leading-[50px] xl:text-[56px] xl:leading-[66px] italic font-black">
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className="text-base leading-[19px] xl:text-xl xl:leading-[24px] font-light mb-2 md:mb-0">
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={link.icon}
                className={`w-11 h-10 ${
                  index === 0
                    ? "mr-[13px]"
                    : index === 1
                    ? "mr-[17px]"
                    : index === 2
                    ? "mr-[21px]"
                    : ""
                }`}
                alt=""
              />
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-end md:justify-between w-full">
        <div className="flex flex-col items-center md:items-start gap-1 w-full md:w-auto">
          <p className="hidden md:block text-lg font-black">RESOURCES</p>
          <div className="flex flex-row md:flex-col justify-center w-full gap-[18px] sm:gap-6 md:gap-1 leading-4">
            {resourcesStampLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className="text-sm leading-[17px] xl:text-base xl:leading-[19px] font-medium hover:text-[#AA00FF]"
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className="block md:hidden leading-[19px] hover:text-[#AA00FF]"
            >
              TERMS
            </a>
          </div>
        </div>

        <div className="text-right hidden md:flex flex-col gap-1">
          <p className="text-lg font-black">STAMPCHAIN</p>
          {stapmChainLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              f-partial={!link.isExternal ? link.href : undefined}
              className="text-sm leading-[17px] xl:text-base xl:leading-[19px] font-medium hover:text-[#AA00FF]"
              target={link.isExternal ? "_blank" : undefined}
            >
              {link.title}
            </a>
          ))}
          <a href="#" className="text-[#440066] mt-5 xl:mt-2">
            <span className="italic">STAMPCHAIN</span> @ 2024
          </a>
        </div>

        <a href="#" className="block md:hidden text-[#440066] text-center mt-6">
          <span className="italic">STAMPCHAIN</span> @ 2024
        </a>
      </div>
    </footer>
  );
}
