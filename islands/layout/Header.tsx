import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";

/* ===== NAVIGATION LINK INTERFACE ===== */
interface NavLink {
  title: string | {
    default: string;
    tablet: string;
  };
  href?: string;
  subLinks?: NavLink[];
}

/* ===== DESKTOP NAVIGATION CONFIGURATION ===== */
const desktopNavLinks: NavLink[] = [
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

/* ===== MOBILE NAVIGATION CONFIGURATION ===== */
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
    ],
  },
];

/* ===== SOCIAL MEDIA LINKS ===== */
const socialLinks = [
  { href: "https://x.com/Stampchain", icon: "/img/footer/XLogo.svg" },
  { href: "https://t.me/BitcoinStamps", icon: "/img/footer/TelegramLogo.svg" },
  { href: "https://discord.gg/PCZU6xrt", icon: "/img/footer/DiscordLogo.svg" },
  {
    href: "https://github.com/stampchain-io/",
    icon: "/img/footer/GithubLogo.svg",
  },
];

/* ===== HEADER LOGO STYLING ===== */
const headerLogo =
  "text-3xl mobileMd:text-4xl mobileLg:text-4xl font-black italic purple-hover-gradient hover:purple-hover-gradient2 transtion-all duration-300 pr-2";

/* ===== MAIN HEADER COMPONENT ===== */
export function Header() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [isWalletModalOpen, setIsWalletModalOpen] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  /* ===== PATH TRACKING EFFECT ===== */
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

  /* ===== BODY SCROLL LOCK HANDLER ===== */
  useEffect(() => {
    // Function to lock scrolling
    const lockScroll = () => {
      // Save current scroll position
      const scrollY = globalThis.scrollY;
      document.body.style.position = "fixed";
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = "100%";
      document.body.style.overflow = "hidden";
    };

    // Function to unlock scrolling
    const unlockScroll = () => {
      // Get the scroll position we saved
      const scrollY = document.body.style.top;

      // Restore body styles
      document.body.style.position = "";
      document.body.style.top = "";
      document.body.style.width = "";
      document.body.style.overflow = "";

      // Restore scroll position
      if (scrollY) {
        globalThis.scrollTo(0, parseInt(scrollY || "0") * -1);
      }
    };

    if (open) {
      // When opening, lock scrolling immediately
      lockScroll();
    } else {
      // When closing, use a timeout to match the drawer animation
      const timer = setTimeout(() => {
        unlockScroll();
      }, 500); // Match your drawer transition duration

      // Clean up the timer if the component unmounts or open changes
      return () => clearTimeout(timer);
    }

    // Clean up when component unmounts or open changes to true
    return () => {
      if (!open) {
        unlockScroll();
      }
    };
  }, [open]);

  /* ===== ORIENTATION CHANGE HANDLER ===== */
  useEffect(() => {
    const handleOrientationChange = () => {
      if (open) {
        closeMenu();
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

  /* ===== WALLET MODAL TOGGLE ===== */
  const toggleWalletModal = () => setIsWalletModalOpen(!isWalletModalOpen);

  /* ===== MENU CLOSE FUNCTION ===== */
  const closeMenu = () => {
    setIsClosing(true);
    setTimeout(() => {
      setOpen(false);
      setIsClosing(false);
    }, 500);
  };

  /* ===== MENU TOGGLE FUNCTION ===== */
  const toggleMenu = () => {
    if (open) {
      closeMenu();
    } else {
      setOpen(true);
    }
  };

  /* ===== NAVIGATION LINKS RENDERER ===== */
  const renderNavLinks = (isMobile = false) => {
    const filteredNavLinks = isMobile ? mobileNavLinks : desktopNavLinks;
    return (
      <>
        {filteredNavLinks.map((link) => (
          <div
            key={typeof link.title === "string"
              ? link.title
              : link.title.default}
            className={`group relative text-base text-stamp-purple font-bold tracking-wide cursor-pointer text-nowrap ${
              isMobile ? "flex flex-col gap-[6px] text-lg" : ""
            }`}
          >
            <a
              href={link.subLinks ? undefined : link.href}
              onClick={() => {
                if (link.subLinks) return;
                if (!link?.href) return;
                toggleMenu();
                setCurrentPath(link?.href ? link?.href : null);
              }}
              className={`inline-block tablet:text-stamp-purple font-extrabold tracking-wider cursor-pointer whitespace-nowrap ${
                isMobile
                  ? `text-xl mobileLg:text-2xl ${
                    link.subLinks
                      ? "text-stamp-grey-darker hover:text-stamp-grey-light font-black "
                      : "text-stamp-grey hover:text-stamp-grey-darker"
                  }`
                  : "group-hover:text-stamp-purple-bright"
              }`}
            >
              <span className="hidden tablet:inline min-[1024px]:hidden">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.tablet}
              </span>
              <span className="tablet:hidden min-[1024px]:inline">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.default}
              </span>
            </a>
            {link.subLinks && (
              <div
                className={`${
                  isMobile
                    ? "hidden group-hover:flex flex-col z-10 w-full gap-1.5"
                    : "hidden group-hover:flex flex-col absolute top-[100%] left-1/2 -translate-x-1/2 min-w-[calc(100%+24px)] min-[1024px]:min-w-[calc(100%+36px)] z-10 pt-[3px] pb-[15px] px-3 min-[1024px]:px-[18px] space-y-[3px] whitespace-nowrap backdrop-blur-md bg-gradient-to-b from-transparent to-[#000000]/30 rounded-b-lg"
                }`}
              >
                {link.subLinks?.map((subLink) => (
                  <a
                    key={subLink.href}
                    href={subLink.href}
                    onClick={() => {
                      toggleMenu();
                      setCurrentPath(subLink?.href ? subLink?.href : null);
                    }}
                    className={`hover:text-stamp-purple-bright text-sm text-left ${
                      currentPath === subLink.href
                        ? "text-stamp-purple-bright"
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

  /* ===== COMPONENT RENDER ===== */
  return (
    <header className="tablet:flex justify-between items-center max-w-desktop w-full
     mx-auto px-3 mobileMd:px-6 desktop:px-12 my-[18px] mobileMd:my-6 mobileLg:my-9 tablet:my-12">
      {/* ===== LOGO AND MOBILE MENU TOGGLE ===== */}
      <div className="flex justify-between items-center w-full ">
        <a
          href="/home"
          f-partial="/home"
          onClick={() => setCurrentPath("home")}
          className={headerLogo}
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
              className="size-5 mobileMd:size-[22px] mr-1.5 transition-all duration-300 ease-in-out"
            />
          )}
          {!open && (
            <img
              src="/img/header/menu-open.svg"
              alt="menu"
              className="size-5 mobileMd:size-[22px] transition-all duration-300 ease-in-out"
            />
          )}
        </button>
      </div>

      {/* ===== DESKTOP NAVIGATION ===== */}
      <div className="hidden tablet:flex justify-between items-center gap-9">
        {renderNavLinks()}
        <ConnectWallet />
      </div>

      {/* ===== MOBILE NAVIGATION DRAWER ===== */}
      <div
        className={`flex tablet:hidden flex-col justify-between
           fixed top-0 right-0 left-auto w-full min-[420px]:w-[380px] h-screen 
           z-30 bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 backdrop-blur-md
           shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.5)]
           px-6 pb-[18px] mobileLg:pb-[49px] pt-[89px] mobileLg:pt-[126px] 
           transition-transform duration-500 ease-in-out will-change-transform
           overflow-y-auto scrollbar-black
         ${open ? "translate-x-0" : "translate-x-full"}`}
        id="navbar-collapse"
      >
        {/* ===== MOBILE MENU LINKS ===== */}
        <div className="flex flex-col items-end justify-between gap-4 text-red-500">
          {renderNavLinks(true)}
          <ConnectWallet />
        </div>

        {/* ===== SOCIAL MEDIA ICONS ===== */}
        {
          /* <div className="flex justify-center items-center">
          {socialLinks.map((link, index) => (
            <a key={link.href} href={link.href} target="_blank">
              <img
                src={link.icon}
                className={`size-[31px] mobileLg:size-[46px] ${
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
        </div> */
        }
      </div>
    </header>
  );
}
