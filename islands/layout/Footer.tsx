import { useState } from "preact/hooks";

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
  {
    href: "https://x.com/Stampchain",
    icon: "/img/footer/XLogo.svg",
    hoverIcon: "/img/footer/XLogo-hover.svg",
  },
  {
    href: "https://t.me/BitcoinStamps",
    icon: "/img/footer/TelegramLogo.svg",
    hoverIcon: "/img/footer/TelegramLogo-hover.svg",
  },
  {
    href: "https://discord.gg/BRYRt4bH",
    icon: "/img/footer/DiscordLogo.svg",
    hoverIcon: "/img/footer/DiscordLogo-hover.svg",
  },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.svg",
    hoverIcon: "/img/footer/GithubLogo-hover.svg",
  },
];

export function Footer() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <footer className="px-3 tablet:px-6 desktop:px-12 py-6 tablet:py-[72px] text-[#8800CC] font-medium max-w-desktop w-full mx-auto flex flex-col tablet:flex-row justify-between gap-4 text-sm tablet:text-lg">
      <div className="w-full flex flex-col gap-1 items-center tablet:items-start">
        <p className="purple-gradient2 text-[40px] leading-[47px] mobileLg:text-[42px] mobileLg:leading-[50px] desktop:text-[56px] desktop:leading-[66px] italic font-black">
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className="text-base leading-[19px] desktop:text-xl desktop:leading-[24px] font-light mb-2 tablet:mb-0">
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={hoveredIndex === index ? link.hoverIcon : link.icon}
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
                onMouseEnter={() =>
                  setHoveredIndex(index)}
                onMouseLeave={() =>
                  setHoveredIndex(null)}
              />
            </a>
          ))}
        </div>
      </div>

      <div className="flex flex-col tablet:flex-row justify-end tablet:justify-between w-full">
        <div className="flex flex-col items-center tablet:items-start gap-1 w-full tablet:w-auto">
          <p className="hidden tablet:block text-lg font-black">RESOURCES</p>
          <div className="flex flex-row tablet:flex-col justify-center w-full gap-[18px] mobileLg:gap-6 tablet:gap-1 leading-4">
            {resourcesStampLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className="text-sm leading-[17px] desktop:text-base desktop:leading-[19px] font-medium hover:text-[#AA00FF]"
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className="block tablet:hidden leading-[19px] hover:text-[#AA00FF]"
            >
              TERMS
            </a>
          </div>
        </div>

        <div className="text-right hidden tablet:flex flex-col gap-1">
          <p className="text-lg font-black">STAMPCHAIN</p>
          {stapmChainLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              f-partial={!link.isExternal ? link.href : undefined}
              className="text-sm leading-[17px] desktop:text-base desktop:leading-[19px] font-medium hover:text-[#AA00FF]"
              target={link.isExternal ? "_blank" : undefined}
            >
              {link.title}
            </a>
          ))}
          <a href="#" className="text-[#440066] mt-5 desktop:mt-2">
            <span className="italic">STAMPCHAIN</span> @ 2024
          </a>
        </div>

        <a
          href="#"
          className="block tablet:hidden text-[#440066] text-center mt-6"
        >
          <span className="italic">STAMPCHAIN</span> @ 2024
        </a>
      </div>
    </footer>
  );
}
