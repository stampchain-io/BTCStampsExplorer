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
  { title: "DONATE", href: "/about#donate" },
  { title: "CONTACT", href: "/about#contact" },
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

const footerLogo =
  "purple-gradient2 text-4xl leading-[43.2px] mobileLg:text-5xl mobileLg:leading-[57.6px] italic font-black";
const footerTagline =
  "text-stamp-purple-bright text-sm leading-[16.8px] mobileLg:text-lg mobileLg:leading-[21.6px] font-light mb-3 mobileLg:mb-[18px]";
const footerNavTitle =
  "text-stamp-purple-dark hidden tablet:block text-lg leading-[23.4px] tracking-wide font-black";
const navContent =
  "text-stamp-purple-dark text-xs leading-[14.4px] mobileLg:text-sm mobileLg:leading-[16.8px] tablet:text-base tablet:leading-[19.2px] font-medium hover:text-stamp-purple-bright";
const copyright =
  "text-xs leading-[14.4px] tablet:text-sm tablet:leading-[16.8px] font-medium text-stamp-purple-darker/75";

export function Footer() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <footer className="
      px-3 tablet:px-6 desktop:px-12 py-6 tablet:py-18
      max-w-desktop w-full mx-auto flex flex-col tablet:flex-row justify-between gap-2 mobileLg:gap-3 tablet:gap-4
    ">
      <img
        src="/img/home/stamp-logo-dark-600.png"
        alt=""
        class="
          absolute
          w-[210px] mobileLg:w-[270px] tablet:w-[180px]
          h-[210px] mobileLg:h-[270px] tablet:h-[180px]
          bottom-[30px] mobileLg:bottom-[27px] tablet:bottom-[4px]
          left-[calc(50%+19px)] mobileLg:left-[calc(50%+13px)] tablet:left-[314px] desktop:left-[338px]
          pointer-events-none
          opacity-15 tablet:opacity-40
          z-[-999]
        "
      />
      <div className="w-full flex flex-col gap-1 items-center tablet:items-start">
        <p className={footerLogo}>
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className={footerTagline}>
          IMMORTALISED ART - STORED ON BITCOIN
        </p>
        <div className="flex flex-row tablet:hidden justify-center w-full gap-[18px] mobileLg:gap-6 leading-4 text-right mb-1 mobileLg:mb-2">
          {stampChainLinks.map((link, index) => (
            <a
              key={index}
              href={link.href}
              f-partial={!link.isExternal ? link.href : undefined}
              className={navContent +
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
                className={`w-[31px] h-[31px] mobileLg:w-[39px] mobileLg:h-[39px] my-1.5 tablet:my-0 ${
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

      <div className="flex flex-col tablet:flex-row w-full justify-end tablet:justify-between tablet:pt-3">
        <div className="flex flex-col w-full tablet:w-1/2 items-center tablet:items-start gap-1.5">
          <p className={footerNavTitle}>RESOURCES</p>
          <div className="flex flex-row tablet:flex-col w-full justify-center gap-[18px] mobileLg:gap-6 tablet:gap-1">
            {resourcesStampLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className={navContent}
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
            <a
              href="/termsofservice"
              f-partial="/termsofservice"
              className={`${navContent} block tablet:hidden`}
            >
              TERMS
            </a>
          </div>
        </div>

        <div className="hidden flex-col tablet:flex w-full tablet:w-1/2 justify-center gap-1.5 text-right">
          <p className={footerNavTitle}>STAMPCHAIN</p>
          <div className="flex flex-col w-full gap-1">
            {stampChainLinks.map((link, index) => (
              <a
                key={index}
                href={link.href}
                f-partial={!link.isExternal ? link.href : undefined}
                className={navContent}
                target={link.isExternal ? "_blank" : undefined}
              >
                {link.title}
              </a>
            ))}
          </div>

          <p
            className={`${copyright} hidden tablet:block mt-[9px]`}
          >
            <span className="italic font-bold">STAMPCHAIN</span> @ 2025
          </p>
        </div>

        <p
          className={`${copyright} block tablet:hidden text-center mt-[18px] mobileLg:mt-6`}
        >
          <span className="italic font-bold">STAMPCHAIN</span> @ 2025
        </p>
      </div>
    </footer>
  );
}
