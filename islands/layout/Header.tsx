import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

interface NavLink {
  title: string;
  href?: string;
  subLinks?: NavLink[];
}

const desktopNavLinks: NavLink[] = [
  {
    title: "ART STAMPS",
    href: "#",
    subLinks: [
      { title: "ALL", href: "/stamp?type=classic" },
      { title: "COLLECTIONS", href: "/collection" },
      { title: "STAMPING", href: "/stamping/stamp" },
      { title: "TRANSFER", href: "/stamping/stamp/transfer" },
    ],
  },
  {
    title: "SRC-20 TOKENS",
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
    title: "BITNAME DOMAINS",
    href: "#",
    subLinks: [
      { title: "ALL", href: "/src101" },
      { title: "REGISTER", href: "/stamping/src101/mint" },
      { title: "TRANSFER", href: "/stamping/src101/transfer" },
    ],
  },
];

const mobileNavLinks: NavLink[] = [
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
      { title: "TRANSFER BITNAME", href: "/stamping/src101/transfer" },
    ],
  },
];

const socialLinks = [
  { href: "https://x.com/Stampchain", icon: "/img/footer/XLogo.svg" },
  { href: "https://t.me/BitcoinStamps", icon: "/img/footer/TelegramLogo.svg" },
  { href: "https://discord.gg/PCZU6xrt", icon: "/img/footer/DiscordLogo.svg" },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.svg",
  },
];

const logoClassName =
  "purple-hover-gradient hover:purple-hover-gradient2 transtion-all duration-300 text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black italic pr-2";

export function Header() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);

  useEffect(() => {
    // Set initial path
    setCurrentPath(globalThis?.location?.pathname || null);

    // Update path on route change
    const handleRouteChange = () => {
      setCurrentPath(globalThis?.location?.pathname || null);
    };

    // Listen for route changes
    globalThis.addEventListener("popstate", handleRouteChange);

    return () => {
      globalThis.removeEventListener("popstate", handleRouteChange);
    };
  }, []);

  useEffect(() => {
    const handleOrientationChange = () => {
      if (open) {
        setOpen(false);
        document.body.style.overflow = "";
      }
    };

    globalThis.addEventListener("orientationchange", handleOrientationChange);
    return () => {
      globalThis.removeEventListener(
        "orientationchange",
        handleOrientationChange,
      );
    };
  }, [open]);

  const toggleWalletModal = () => setIsWalletModalOpen(!isWalletModalOpen);

  const toggleMenu = () => {
    setOpen(!open);

    // Toggle body scroll lock
    if (!open) {
      // When opening menu - disable body scroll
      document.body.style.overflow = "hidden";
      document.body.style.position = "fixed";
      document.body.style.width = "100%";
      document.body.style.height = "100%";
    } else {
      // When closing menu - enable body scroll
      document.body.style.overflow = "";
      document.body.style.position = "";
      document.body.style.width = "";
      document.body.style.height = "";
    }
  };

  const renderNavLinks = (isMobile = false) => {
    const filteredNavLinks = isMobile ? mobileNavLinks : desktopNavLinks;
    return (
      <>
        {filteredNavLinks.map((link) => (
          <div
            key={link.title}
            className={`group relative cursor-pointer text-nowrap ${
              isMobile ? "flex flex-col gap-[6px] text-lg" : ""
            }`}
          >
            <a
              href={link.subLinks ? undefined : link.href}
              f-partial={link.subLinks ? undefined : link.href}
              onClick={() => {
                if (link.subLinks) return;
                if (!link?.href) return;
                toggleMenu();
                setCurrentPath(link?.href ? link?.href : null);
              }}
              className={`inline-block whitespace-nowrap ${
                isMobile
                  ? `text-xl mobileLg:text-2xl ${
                    link.subLinks
                      ? "text-stamp-purple-dark"
                      : "text-stamp-purple"
                  }`
                  : "text-lg text-center group-hover:text-stamp-purple-highlight"
              }`}
            >
              {link.title}
            </a>
            {link.subLinks && (
              <div
                className={`${
                  isMobile
                    ? "hidden group-hover:flex flex-col z-90 w-full gap-1.5"
                    : "hidden group-hover:flex flex-col absolute top-0 left-0 z-90 pt-[32px] pb-[15px] space-y-[3px] w-full"
                }`}
              >
                {link.subLinks?.map((subLink) => (
                  <a
                    key={subLink.href}
                    href={subLink.href}
                    f-partial={subLink.href}
                    onClick={() => {
                      toggleMenu();
                      setCurrentPath(subLink?.href ? subLink?.href : null);
                    }}
                    className={`hover:text-stamp-purple-highlight text-base mobileLg:text-lg tablet:text-base ${
                      currentPath === subLink.href
                        ? "text-stamp-purple-highlight"
                        : ""
                    }`}
                  >
                    {subLink.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        ))}
      </>
    );
  };

  return (
    <header className="tablet:flex justify-between items-center max-w-desktop w-full mx-auto px-3 mobileMd:px-6 desktop:px-12 my-[18px] mobileMd:my-6 mobileLg:my-9 tablet:my-12">
      <div className="flex justify-between items-center w-full ">
        <a
          href="/home"
          f-partial="/home"
          onClick={() => setCurrentPath("home")}
          className={logoClassName}
        >
          STAMPCHAIN
        </a>
        <button
          onClick={toggleMenu}
          className="tablet:hidden block relative z-40"
          id="navbar-toggle"
        >
          {open && (
            <img
              src="/img/header/menu-close.svg"
              alt="menu"
              className="w-5 h-5 mr-1.5"
            />
          )}
          {!open && (
            <img
              src="/img/header/menu-open.svg"
              alt="menu"
              className="w-5 h-5"
            />
          )}
        </button>
      </div>

      {/* Desktop Navbar */}
      <div className="hidden tablet:flex justify-between items-center gap-9 font-black text-stamp-purple">
        {renderNavLinks()}
        <ConnectWallet toggleModal={toggleWalletModal} />
      </div>

      {/* Mobile Navbar */}
      <div
        className={`flex tablet:hidden flex-col justify-between fixed left-0 top-0 w-full h-screen z-30 backdrop-blur-md bg-gradient-to-b from-[#171717]/40 to-[#171717]/80 scroll-none px-6 pb-[18px] mobileLg:pb-[49px] pt-[89px] mobileLg:pt-[126px] font-black text-stamp-purple duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        id="navbar-collapse"
      >
        <div className="font-black text-center flex flex-col items-center justify-between gap-3">
          {renderNavLinks(true)}
          <ConnectWallet toggleModal={toggleWalletModal} />
        </div>

        <div className="flex justify-center items-center">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={link.icon}
                className={`w-[31px] h-[31px] mobileLg:w-[46px] desktop:h-[46px] ${
                  index === 0
                    ? "mr-[12px] mobileLg:mr-[13px]"
                    : index === 1
                    ? "mr-[13px] mobileLg:mr-[17px]"
                    : index === 2
                    ? "mr-[17px] mobileLg:mr-[21px]"
                    : ""
                }`}
                alt=""
              />
            </a>
          ))}
        </div>
      </div>
    </header>
  );
}
