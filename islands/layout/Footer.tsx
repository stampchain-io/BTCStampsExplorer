/* ===== FOOTER COMPONENT ===== */
import { useState } from "preact/hooks";
import { DiscordIcon, GitHubIcon, TelegramIcon, TwitterIcon } from "$icons";
import {
  copyright,
  footerLogo,
  footerNavTitle,
  footerTagline,
  navContent,
} from "$text";

/* ===== FOOTER LINK INTERFACE ===== */
interface FooterLink {
  title: string;
  href: string;
  isExternal?: boolean;
  hiddenOnMobile?: boolean;
}

/* ===== NAVIGATION CONFIGURATIONS ===== */
const resourcesLinks: FooterLink[] = [
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

const aboutLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "DONATE", href: "/about#donate" },
  { title: "CONTACT", href: "/about#contact" },
  { title: "TERMS", href: "/termsofservice", hiddenOnMobile: true },
];

const mobileLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "DONATE", href: "/about#donate" },
  { title: "MEDIA", href: "/media" },
  { title: "HOW-TO", href: "/howto" },
  { title: "FAQ", href: "/faq" },
  { title: "TERMS", href: "/termsofservice" },
];

/* ===== SOCIAL MEDIA CONFIGURATION ===== */
const socialLinks = [
  {
    href: "https://x.com/Stampchain",
    icon: <TwitterIcon size="md" color="purple" className="-mr-1" />,
  },
  {
    href: "https://t.me/BitcoinStamps",
    icon: <TelegramIcon size="md" color="purple" />,
  },
  {
    href: "https://discord.gg/BRYRt4bH",
    icon: <DiscordIcon size="md" color="purple" className="mr-1" />,
  },
  {
    href: "https://github.com/stampchain-io/",
    icon: <GitHubIcon size="md" color="purple" />,
  },
];

/* ===== MAIN FOOTER COMPONENT ===== */
export function Footer() {
  /* ===== STATE MANAGEMENT ===== */
  const [hoveredIndex, setHoveredIndex] = useState<number | null>(null);

  /* ===== COMPONENT RENDER ===== */
  return (
    <footer className="
      flex flex-col tablet:flex-row justify-between max-w-desktop w-full mx-auto 
      px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop
      pt-24 pb-6 tablet:pt-24 tablet:pb-9
      gap-2 mobileLg:gap-3 tablet:gap-4
    ">
      {/* ===== BACKGROUND LOGO ===== */}
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

      {/* ===== LEFT SECTION: LOGO AND SOCIAL LINKS ===== */}
      <div className="
        flex flex-row tablet:flex-col justify-between tablet:justify-start 
        items-center tablet:items-start w-full gap-1
      ">
        {/* Logo and Tagline */}
        <div className="flex flex-col">
          <p className={footerLogo}>
            STAMPCHAIN
            <span className="font-extralight pr-1">.IO</span>
          </p>
          <p className={`${footerTagline} -mt-5`}>
            IMMORTALISED ART - STORED ON BITCOIN
          </p>
        </div>

        {/* Social Media Icons */}
        <div className="flex gap-4 mt-0 tablet:mt-[18px]">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              {link.icon}
            </a>
          ))}
        </div>
      </div>

      {/* ===== RIGHT SECTION: NAVIGATION LINKS ===== */}
      <div className="
        flex flex-col justify-end tablet:justify-between w-full tablet:w-[420px] tablet:pt-1
        bg-gradient-to-r from-[#AA00FF]/80 via-[#AA00FF]/60 to-[#AA00FF]/40
        text-transparent bg-clip-text
      ">
        <div className="flex flex-row justify-end">
          {/* ===== RESOURCES LINKS ===== */}
          <div className="flex flex-col w-full tablet:w-1/2 items-center tablet:items-start gap-1.5">
            <p className={`${footerNavTitle} hidden`}>RESOURCES</p>
            <div className="flex flex-row tablet:flex-col w-full justify-center gap-[18px] mobileLg:gap-6 tablet:gap-1">
              {resourcesLinks.map((link, index) => (
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

          {/* ===== STAMPCHAIN LINKS (DESKTOP) ===== */}
          <div className="hidden flex-col tablet:flex w-full tablet:w-1/2 justify-center gap-1.5 text-right">
            <p className={`${footerNavTitle} hidden `}>STAMPCHAIN</p>
            <div className="flex flex-col w-full gap-1">
              {mobileLinks.map((link, index) => (
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

        {/* ===== COPYRIGHT SECTION ===== */}
        <div className="flex flex-row justify-end">
          <p
            className={`${copyright} hidden tablet:block mt-3 mb-0`}
          >
            <span className="italic">STAMPCHAIN</span> @ 2025
          </p>

          <p
            className={`${copyright} block tablet:hidden text-center mt-5 mobileLg:mt-6 mb-0`}
          >
            <span className="italic font-bold">STAMPCHAIN</span> @ 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
