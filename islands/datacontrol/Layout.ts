interface NavLink {
  title: string | {
    default: string;
    tablet: string;
  };
  href?: string;
  subLinks?: NavLink[];
}

interface FooterLink {
  title: string;
  href: string;
  isExternal?: boolean;
  hiddenOnMobile?: boolean;
}

export const desktopNavLinks: NavLink[] = [
  {
    title: {
      default: "ART STAMPS",
      tablet: "STAMPS",
    },
    href: "#",
    subLinks: [
      { title: "ALL", href: "/stamp?type=classic" },
      { title: "COLLECTIONS", href: "/collection" },
      { title: "STAMPING", href: "/stamping/stamp" },
      { title: "TRANSFER", href: "/stamping/stamp/transfer" },
    ],
  },
  {
    title: {
      default: "SRC-20 TOKENS",
      tablet: "TOKENS",
    },
    href: "#",
    subLinks: [
      { title: "ALL", href: "/src20" },
      { title: "TRENDING", href: "/src20?type=trending" },
      { title: "DEPLOY", href: "/stamping/src20/deploy" },
      { title: "MINT", href: "/stamping/src20/mint" },
      { title: "TRANSFER", href: "/stamping/src20/transfer" },
    ],
  },
  {
    title: {
      default: "BITNAME DOMAINS",
      tablet: "BITNAME",
    },
    href: "#",
    subLinks: [
      { title: "REGISTER", href: "/stamping/src101/mint" },
    ],
  },
];

export const mobileNavLinks: NavLink[] = [
  {
    title: "ART STAMPS",
    href: "/stamp?type=classic",
  },
  {
    title: "COLLECTIONS",
    href: "/collection",
  },
  {
    title: "SRC-20 TOKENS",
    href: "/src20",
  },
  {
    title: "TRENDING TOKENS",
    href: "/src20?type=trending",
  },
  {
    title: "TOOLS",
    href: "#",
    subLinks: [
      { title: "STAMPING", href: "/stamping/stamp" },
      { title: "TRANSFER STAMP", href: "/stamping/stamp/transfer" },
      { title: "DEPLOY TOKEN", href: "/stamping/src20/deploy" },
      { title: "MINT TOKEN", href: "/stamping/src20/mint" },
      { title: "TRANSFER TOKEN", href: "/stamping/src20/transfer" },
      { title: "REGISTER BITNAME", href: "/stamping/src101/mint" },
    ],
  },
];

export const socialLinks = [
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
    href: "https://discord.gg/PCZU6xrt",
    icon: "/img/footer/DiscordLogo.svg",
    hoverIcon: "/img/footer/DiscordLogo-hover.svg",
  },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.svg",
    hoverIcon: "/img/footer/GithubLogo-hover.svg",
  },
];

export const resourcesStampLinks: FooterLink[] = [
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

export const stampChainLinks: FooterLink[] = [
  { title: "ABOUT", href: "/about" },
  { title: "DONATE", href: "/about#donate" },
  { title: "CONTACT", href: "/about#contact" },
  { title: "TERMS OF SERVICE", href: "/termsofservice", hiddenOnMobile: true },
];
