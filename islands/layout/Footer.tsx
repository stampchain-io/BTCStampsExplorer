/* ===== FOOTER COMPONENT ===== */
import { Icon } from "$icons";
import {
  copyright,
  logoPurpleDL,
  navLinkPurple,
  overlayPurple,
  tagline,
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
  { title: "TERMS", href: "/termsofservice" },
];

const mobileLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "MEDIA", href: "/media" },
  { title: "HOW-TO", href: "/howto" },
  { title: "FAQ", href: "/faq" },
  { title: "DONATE", href: "/about#donate" },
  { title: "TERMS", href: "/termsofservice", hiddenOnMobile: true },
];

/* ===== SOCIAL MEDIA CONFIGURATION ===== */
const socialLinks = [
  {
    icon: (
      <Icon
        name="twitter"
        weight="light"
        size="lg"
        color="purple"
        type="iconLink"
        href="https://x.com/Stampchain"
        target="_blank"
      />
    ),
  },
  {
    icon: (
      <Icon
        name="telegram"
        weight="light"
        size="lg"
        color="purple"
        type="iconLink"
        href="https://t.me/BitcoinStamps"
        target="_blank"
      />
    ),
  },
  {
    icon: (
      <Icon
        name="discord"
        weight="light"
        size="lg"
        color="purple"
        type="iconLink"
        href="https://discord.gg/BRYRt4bH"
        target="_blank"
      />
    ),
  },
  {
    icon: (
      <Icon
        name="github"
        weight="light"
        size="lg"
        color="purple"
        type="iconLink"
        href="https://github.com/stampchain-io/"
        target="_blank"
      />
    ),
  },
];

/* ===== MAIN FOOTER COMPONENT ===== */
export function Footer() {
  /* ===== COMPONENT RENDER ===== */
  return (
    <footer className="
      flex flex-col tablet:flex-row justify-between max-w-desktop w-full mx-auto 
      px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop
      pt-24 pb-6 tablet:pt-24 tablet:pb-6
      gap-2 mobileLg:gap-3 tablet:gap-4
    ">
      {/* ===== BACKGROUND LOGO ===== */}
      <img
        src="/img/home/stampchain-logo-480.svg"
        alt=""
        className="
          absolute z-[-999]
          size-[210px] mobileLg:size-[270px] tablet:size-[230px]
          bottom-[31px] mobileLg:bottom-[28px] tablet:-bottom-9
          left-[calc(50%+18px)] mobileLg:left-[calc(50%+69px)] tablet:left-[-115px]
          opacity-25 tablet:opacity-20 pointer-events-none
          [mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,1))]
          [-webkit-mask-image:linear-gradient(180deg,rgba(0,0,0,0.5),rgba(0,0,0,1))]
        "
      />

      {/* ===== MOBILE SMALL CENTER SECTION - MOBILE MEDIUM+ LEFT SECTION ===== */}
      <div className="
        flex flex-col mobileMd:flex-row tablet:flex-col w-full 
        justify-start mobileMd:justify-between tablet:justify-start 
        items-center mobileMd:items-end tablet:items-start gap-1
      ">
        {/* ===== LOGO AND TAGLINE ===== */}
        <div className="flex flex-col">
          <p className={`${logoPurpleDL} text-center mobileMd:text-left`}>
            STAMPCHAIN
            <span className="font-extralight pr-1">.IO</span>
          </p>
          <p
            className={`${tagline} -mt-5 text-center mobileMd:text-left`}
          >
            IMMORTALISED ART - STORED ON BITCOIN
          </p>
        </div>

        {/* ===== SOCIAL MEDIA ICONS ===== */}
        <div className="flex gap-4 mt-3 mobileMd:mt-0 tablet:mt-3">
          {socialLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              {link.icon}
            </a>
          ))}
        </div>
      </div>

      {/* ===== DESKTOP RIGHT SECTION ===== */}
      <div className={`${overlayPurple}`}>
        <div className="hidden tablet:flex flex-row justify-end w-[300px] pt-1">
          {/* ===== RESOURCES LINKS ===== */}
          <div className="flex w-1/2 ">
            <div className="flex flex-col w-full justify-center gap-1">
              {resourcesLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  f-partial={link.isExternal ? "" : link.href}
                  className={`${navLinkPurple}`}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>

          {/* ===== ABOUT LINKS  ===== */}
          <div className="flex w-1/2">
            <div className="flex flex-col w-full justify-center gap-1 text-right">
              {aboutLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  f-partial={link.isExternal ? "" : link.href}
                  className={`${navLinkPurple}`}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                >
                  {link.title}
                </a>
              ))}
            </div>
          </div>
        </div>

        {/* ===== MOBILE BOTTOM ROW SECTION ===== */}
        {/* ===== MIXED LINKS  ===== */}
        <div className="flex tablet:hidden w-[360px] mobileMd:w-full justify-center mobileMd:justify-start mx-auto mt-2 mobileMd:mt-1 mb-2">
          <div className="flex flex-row w-full justify-between">
            {mobileLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                f-partial={link.isExternal ? "" : link.href}
                className={`${navLinkPurple}`}
                target={link.isExternal ? "_blank" : undefined}
                rel={link.isExternal ? "noopener noreferrer" : undefined}
              >
                {link.title}
              </a>
            ))}
            {/* ===== COPYRIGHT SECTION - MOBILEMD + MOBILELG ===== */}
            <p
              className={`${copyright} hidden mobileMd:block tablet:hidden`}
            >
              <span className="italic">STAMPCHAIN</span> @ 2025
            </p>
          </div>
        </div>

        {/* ===== COPYRIGHT SECTION - BASE/MOBILESM + TABLET/DESKTOP ===== */}
        <div className="flex flex-row mobileMd:hidden tablet:block w-full justify-center tablet:justify-end tablet:text-right mt-3 tablet:mt-4">
          <p className={`${copyright}`}>
            <span className="italic">STAMPCHAIN</span> @ 2025
          </p>
        </div>
      </div>
    </footer>
  );
}
