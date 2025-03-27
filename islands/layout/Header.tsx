import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";
import { HamburgerMenuIcon } from "$icons";
import { logoPurpleLDLink } from "$text";

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
            className={`relative w-full group tracking-wide transition-colors duration-300 cursor-pointer text-nowrap ${
              isMobile
                ? "flex flex-col gap-3 font-bold text-lg text-stamp-grey hover:text-stamp-grey-light"
                : "font-bold text-base text-stamp-purple"
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
              className={`inline-block w-full tracking-wider transition-colors duration-300 cursor-pointer whitespace-nowrap ${
                isMobile
                  ? ` ${
                    link.subLinks
                      ? "font-extrabold text-lg text-stamp-grey-darker group-hover:text-stamp-grey "
                      : "font-light text-3xl text-transparent bg-clip-text bg-gradient-to-r from-stamp-grey-light via-stamp-grey to-stamp-grey-darker hover:text-stamp-grey-light inline-block "
                  }`
                  : "font-extrabold text-stamp-purple group-hover:text-stamp-purple-bright"
              }`}
            >
              <span className="hidden">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.tablet}
              </span>
              <span className="">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.default}
              </span>
            </a>
            {link.subLinks && (
              <div
                className={`${
                  isMobile
                    ? "hidden group-hover:flex flex-col z-10 w-full gap-1.5 group"
                    : "hidden group-hover:flex flex-col absolute top-full left-1/2 -translate-x-1/2 min-w-[calc(100%+36px)] z-10 pt-1 pb-3.5 px-[18px] space-y-1 whitespace-nowrap backdrop-blur-md bg-gradient-to-b from-transparent to-[#000000]/30 rounded-b-lg"
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
                    className={`transition-colors duration-300 ${
                      isMobile
                        ? currentPath === subLink.href
                          ? "text-base text-stamp-grey-light hover:text-stamp-grey py-1"
                          : "text-base text-stamp-grey hover:text-stamp-grey-light py-1"
                        : currentPath === subLink.href
                        ? "text-sm text-stamp-purple-bright hover:text-stamp-purple"
                        : "text-sm text-stamp-purple hover:text-stamp-purple-bright"
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
    <header className="tablet:flex justify-between items-center max-w-desktop w-full mx-auto
     px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop 
     pt-6 pb-9 mobileLg:pt-9 mobileLg:pb-14">
      {/* ===== LOGO AND MOBILE MENU TOGGLE BUTTON ===== */}
      <div className="flex justify-between items-center w-full ">
        <a
          href="/home"
          f-partial="/home"
          onClick={() => setCurrentPath("home")}
          className={`${logoPurpleLDLink} pr-3`}
        >
          STAMPCHAIN
        </a>
        <div className="tablet:hidden block relative z-40">
          <HamburgerMenuIcon isOpen={open} onClick={toggleMenu} />
        </div>
      </div>

      {/* ===== DESKTOP NAVIGATION ===== */}
      <div className="hidden tablet:flex justify-between items-center gap-9">
        {renderNavLinks()}
        <ConnectWallet />
      </div>

      {/* ===== MOBILE NAVIGATION DRAWER ===== */}
      <div
        className={`flex tablet:hidden flex-col justify-between
           fixed top-0 right-0 left-auto w-full min-[420px]:w-[380px] h-screen z-30
           bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 backdrop-blur-md
           p-9 pt-[88px] shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.5)]
           transition-transform duration-500 ease-in-out will-change-transform
           overflow-y-auto overflow-x-hidden scrollbar-black
         ${open ? "translate-x-0" : "translate-x-full"}`}
        id="navbar-collapse"
      >
        {/* ===== MOBILE MENU LINKS AND CONNECT BUTTON ===== */}
        <div className="flex flex-col h-full justify-between">
          <div className="flex flex-col items-start gap-4">
            {renderNavLinks(true)}
          </div>

          <div className="flex w-full sticky bottom-0 justify-between">
            <div className="flex justify-end">
              <ConnectWallet />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
