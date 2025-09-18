/* ===== FOOTER COMPONENT ===== */
import { STAMPCHAIN_LOGO_IMAGE } from "$constants";
import { Icon } from "$icon";
import { containerBackground } from "$layout";
import {
  copyright,
  logoPurpleDL,
  navLinkTransparentPurple,
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
        type="iconButton"
        name="twitter"
        weight="light"
        size="md"
        color="purple"
        href="https://x.com/Stampchain"
        target="_blank"
      />
    ),
  },
  {
    icon: (
      <Icon
        type="iconButton"
        name="telegram"
        weight="light"
        size="md"
        color="purple"
        href="https://t.me/BitcoinStamps"
        target="_blank"
      />
    ),
  },
  {
    icon: (
      <Icon
        type="iconButton"
        name="discord"
        weight="light"
        size="md"
        color="purple"
        href="https://discord.gg/BRYRt4bH"
        target="_blank"
      />
    ),
  },
  {
    icon: (
      <Icon
        type="iconButton"
        name="github"
        weight="light"
        size="md"
        color="purple"
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
    <footer class="
      flex flex-col tablet:flex-row justify-between max-w-desktop w-full mx-auto
      px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop
      pt-24 pb-6 tablet:pt-24 tablet:pb-6
      gap-2 mobileMd:gap-3 tablet:gap-4
    ">
      {/* ===== BACKGROUND LOGO ===== */}
      <img
        src={STAMPCHAIN_LOGO_IMAGE}
        alt=""
        class="
          absolute z-[-999]
          size-[270px] mobileMd:size-[250px]
          -bottom-11 mobileMd:-bottom-10
          left-[-135px] mobileMd:left-[-120px]
          opacity-20 pointer-events-none
          [mask-image:linear-gradient(90deg,rgba(0,0,0,0.8),rgba(0,0,0,1))]
          [-webkit-mask-image:linear-gradient(90deg,rgba(0,0,0,0.8),rgba(0,0,0,1))]
        "
      />

      {/* ===== MOBILE SMALL CENTER SECTION - MOBILE MEDIUM+ LEFT SECTION ===== */}
      <div
        class={`${containerBackground} !py-3 tablet:flex-row justify-between`}
      >
        <div class="
        flex flex-col mobileMd:flex-row tablet:flex-col w-full
        justify-start mobileMd:justify-between tablet:justify-start
        items-center mobileMd:items-end tablet:items-start gap-1
      ">
          {/* ===== LOGO AND TAGLINE ===== */}
          <div class="flex flex-col">
            <h5
              class={`${logoPurpleDL} text-center mobileMd:text-left`}
            >
              STAMPCHAIN
              <span class="font-extralight pr-1">.IO</span>
            </h5>
            <h6
              class={`${tagline} text-center mobileMd:text-left`}
            >
              IMMORTALISED ART - STORED ON BITCOIN
            </h6>
          </div>

          {/* ===== SOCIAL MEDIA ICONS ===== */}
          <div class="flex gap-6 tablet:gap-4 mt-3 mobileMd:mt-0 tablet:mt-3">
            {socialLinks.map((link, index) => (
              <div key={index}>
                {link.icon}
              </div>
            ))}
          </div>
        </div>

        {/* ===== DESKTOP RIGHT SECTION ===== */}
        <div class={`${overlayPurple}`}>
          <div class="hidden tablet:flex flex-row justify-end w-[300px] pt-1">
            {/* ===== RESOURCES LINKS ===== */}
            <div class="flex w-1/2 ">
              <div class="flex flex-col w-full justify-center gap-1">
                {resourcesLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    f-partial={link.isExternal ? "" : link.href}
                    class={`${navLinkTransparentPurple}`}
                    target={link.isExternal ? "_blank" : undefined}
                    rel={link.isExternal ? "noopener noreferrer" : undefined}
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>

            {/* ===== ABOUT LINKS  ===== */}
            <div class="flex w-1/2">
              <div class="flex flex-col w-full justify-center gap-1 text-right">
                {aboutLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    f-partial={link.isExternal ? "" : link.href}
                    class={`${navLinkTransparentPurple}`}
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
          <div class="flex tablet:hidden w-[360px] mobileMd:w-full justify-center mobileMd:justify-start mx-auto mt-2 mobileMd:mt-1 mb-2">
            <div class="flex flex-row w-full justify-between">
              {mobileLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  f-partial={link.isExternal ? "" : link.href}
                  class={`${navLinkTransparentPurple}`}
                  target={link.isExternal ? "_blank" : undefined}
                  rel={link.isExternal ? "noopener noreferrer" : undefined}
                >
                  {link.title}
                </a>
              ))}
              {/* ===== COPYRIGHT SECTION - MOBILEMD + MOBILELG ===== */}
              <h6
                class={`${copyright} hidden mobileMd:block tablet:hidden`}
              >
                <span class="italic">STAMPCHAIN</span> &copy; 2025
              </h6>
            </div>
          </div>

          {/* ===== COPYRIGHT SECTION - BASE/MOBILESM + TABLET/DESKTOP ===== */}
          <div class="flex flex-row mobileMd:hidden tablet:block w-full justify-center tablet:justify-end tablet:text-right mt-3 tablet:mt-2">
            <h6 class={`${copyright}`}>
              <span class="italic">STAMPCHAIN</span> &copy; 2025
            </h6>
          </div>
        </div>
      </div>
    </footer>
  );
}
