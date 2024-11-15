import { useState } from "preact/hooks";

interface FooterLink {
  title: string;
  href: string;
  isExternal?: boolean;
  hiddenOnMobile?: boolean;
}

const resourcesStampLinks: FooterLink[] = [
  { title: "FAQ", href: "/faq" },
  { title: "HOW-TO", href: "/howto" },
  { title: "MEDIA", href: "/media" },
  {
    title: "PRESS KIT",
    href:
      "https://drive.google.com/drive/folders/18QsMTZ_ZII5FVxuAs2CLFoLdZE3NOdlT",
    isExternal: true,
  },
];

const stampChainLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "DONATE", href: "/donate" },
  { title: "CONTACT", href: "#" },
  { title: "TERMS OF SERVICE", href: "/termsofservice", hiddenOnMobile: true },
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

const titleClassName =
  "purple-gradient2 text-4xl leading-[43.2px] mobileLg:text-5xl mobileLg:leading-[57.6px] tablet:text-5xl tablet:leading-[57.6px] desktop:text-6xl desktop:leading-8xl italic font-black";
const subTitleClassName =
  "text-stamp-purple-bright text-sm leading-[16.8px] mobileLg:text-lg mobileLg:leading-[21.6px] desktop:text-xl desktop:leading-6 font-light mb-2 mobileLg:mb-3 tablet:mb-2";
const navTitleClassName =
  "text-stamp-primary-dark hidden tablet:block text-lg leading-[21.1px] desktop:text-xl desktop:leading-[23.4px] font-black";
const navContentClassName =
  "text-stamp-primary-dark text-xs leading-[14.4px] mobileLg:text-sm mobileLg:leading-[16.8px] desktop:text-base desktop:leading-[19.2px] font-medium hover:text-stamp-purple-bright";
const copyrightClassName =
  "text-xs leading-[14.4px] desktop:text-sm desktop:leading-[16.8px] font-medium text-[#440066]";

export function Footer() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <footer className="
      px-3 tablet:px-6 desktop:px-12 py-6 tablet:py-18
      max-w-desktop w-full mx-auto flex flex-col tablet:flex-row justify-between gap-2 mobileLg:gap-3 tablet:gap-4
    ">
      <div className="w-full flex flex-col gap-1 items-center tablet:items-start">
        <p className={titleClassName}>
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className={subTitleClassName}>
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex flex-row tablet:hidden justify-center w-full gap-[18px] mobileLg:gap-6 leading-4 text-right mb-1 mobileLg:mb-2">
          {stampChainLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              f-partial={!link.isExternal ? link.href : undefined}
              className={navContentClassName +
                (link?.hiddenOnMobile ? " hidden" : "")}
              target={link.isExternal ? "_blank" : undefined}
            >
              {link.title}
            </a>
          ))}
        </div>
        <div className="flex">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={hoveredIndex === index ? link.hoverIcon : link.icon}
                className={`w-[31px] h-[31px] mobileLg:w-[39px] mobileLg:h-[39px] desktop:w-[46px] desktop:h-[46px] ${
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
          <p className={navTitleClassName}>RESOURCES</p>
          <div className="flex flex-row tablet:flex-col justify-center w-full gap-[18px] mobileLg:gap-6 tablet:gap-1 leading-4">
            {resourcesStampLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className={navContentClassName}
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className={`${navContentClassName} block tablet:hidden`}
            >
              TERMS
            </a>
          </div>
        </div>

        <div className="hidden tablet:flex flex-col justify-center w-full gap-1 text-right">
          <p className={navTitleClassName}>STAMPCHAIN</p>
          {stampChainLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              f-partial={!link.isExternal ? link.href : undefined}
              className={navContentClassName}
              target={link.isExternal ? "_blank" : undefined}
            >
              {link.title}
            </a>
          ))}
          <p
            className={`${copyrightClassName} hidden tablet:block mt-5 desktop:mt-2`}
          >
            <span className="italic font-bold">STAMPCHAIN</span> @ 2024
          </p>
        </div>

        <p
          className={`${copyrightClassName} block tablet:hidden text-center mt-3 mobileLg:mt-6`}
        >
          <span className="italic font-bold">STAMPCHAIN</span> @ 2024
        </p>
      </div>
    </footer>
  );
}
