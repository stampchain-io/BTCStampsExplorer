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
  { title: "TERMS", href: "/termsofservice", hiddenOnMobile: true },
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
  "font-black italic text-4xl leading-[43.2px] mobileLg:text-5xl mobileLg:leading-[57.6px] tablet:text-4xl purple-gradient2";
const footerTagline =
  "font-regular text-sm leading-[16.8px] mobileLg:text-lg mobileLg:leading-[21.6px] tablet:text-sm text-stamp-purple-bright";
const footerNavTitle =
  "font-extrabold text-sm tablet:text-base text-stamp-purple-dark tracking-wide ";
const navContent =
  "text-xs mobileLg:text-sm tablet:text-sm font-medium hover:text-stamp-purple-bright";
const copyright =
  "font-normal text-xs tablet:text-sm text-stamp-purple-darker/30";

export function Footer() {
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  return (
    <footer className="
      flex flex-col tablet:flex-row justify-between max-w-desktop w-full mx-auto 
      px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop
      py-6 tablet:py-18
      gap-2 mobileLg:gap-3 tablet:gap-4
    ">
      <img
        src="/img/home/stampchain-logo-480.svg"
        alt=""
        class="
          absolute z-[-999]
          size-[210px] mobileLg:size-[270px] tablet:size-[230px]
          bottom-[31px] mobileLg:bottom-[28px] tablet:-bottom-9
          left-[calc(50%+18px)] mobileLg:left-[calc(50%+69px)] tablet:left-[-115px]
          opacity-25 tablet:opacity-20 pointer-events-none
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,1))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,1))]

        "
      />
      <div className="flex flex-col items-center tablet:items-start w-full gap-1">
        <p className={footerLogo}>
          STAMPCHAIN
          <span className="font-extralight pr-1">.IO</span>
        </p>
        <p className={`${footerTagline}`}>
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
        <div className="flex mt-3 mobileLg:mt-[18px] tablet:mt-3">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={hoveredIndex === index ? link.hoverIcon : link.icon}
                className={`size-[31px] mobileLg:size-[39px] tablet:size-8 my-1.5 tablet:my-0 ${
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

      <div className="
        flex flex-col justify-end tablet:justify-between w-full tablet:w-80 tablet:pt-1
        bg-gradient-to-r from-[#AA00FF]/90 via-[#AA00FF]/60 to-[#AA00FF]/30
        text-transparent bg-clip-text
      ">
        <div className="flex flex-row justify-end">
          <div className="flex flex-col w-full tablet:w-1/2 items-center tablet:items-start gap-1.5">
            <p className={`${footerNavTitle} hidden`}>RESOURCES</p>
            <div className="flex flex-row tablet:flex-col w-full justify-center gap-[18px] mobileLg:gap-6 tablet:gap-1">
              {resourcesStampLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  f-partial={!link.isExternal ? link.href : undefined}
                  className={`${navContent}`}
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
            <p className={`${footerNavTitle} hidden `}>STAMPCHAIN</p>
            <div className="flex flex-col w-full gap-1">
              {stampChainLinks.map((link, index) => (
                <a
                  key={index}
                  href={link.href}
                  f-partial={!link.isExternal ? link.href : undefined}
                  className={`${navContent} `}
                  target={link.isExternal ? "_blank" : undefined}
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </div>
        <div className="flex flex-row justify-end">
          <p
            className={`${copyright} hidden tablet:block mt-[9px]`}
          >
            <span className="italic">STAMPCHAIN</span> @ 2025
          </p>

          <p
            className={`${copyright} block tablet:hidden text-center mt-[18px] mobileLg:mt-6`}
          >
            <span className="italic font-bold">STAMPCHAIN</span> @ 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
