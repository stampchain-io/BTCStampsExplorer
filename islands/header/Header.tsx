/* ===== HEADER COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import { ConnectButton } from "$islands/button/ConnectButton.tsx";
import { CloseIcon, GearIcon, HamburgerMenuIcon } from "$icon";
import {
  logoPurpleLDLink,
  navLinkGrey,
  navLinkGreyLD,
  navLinkPurple,
} from "$text";

/* ===== NAVIGATION LINK INTERFACE ===== */
interface NavLink {
  title: string | {
    default: string;
    tablet: string;
  };
  href?: string;
  subLinks?: NavLink[];
}

/* ===== TOOLS CONFIGURATION ===== */
const toolLinks = [
  { title: "STAMPING", href: "/tool/stamp/stamping" },
  { title: "TRANSFER STAMP", href: "/tool/stamp/transfer" },
  { title: "DEPLOY TOKEN", href: "/tool/src20/deploy" },
  { title: "MINT TOKEN", href: "/tool/src20/mint" },
  { title: "TRANSFER TOKEN", href: "/tool/src20/transfer" },
  { title: "REGISTER BITNAME", href: "/tool/src101/mint" },
];

/* ===== DESKTOP NAVIGATION CONFIGURATION ===== */
const desktopNavLinks: NavLink[] = [
  {
    title: {
      default: "ART STAMPS",
      tablet: "STAMPS",
    },
    href: "/stamp?type=classic",
  },
  {
    title: {
      default: "COLLECTIONS",
      tablet: "COLLECTIONS",
    },
    href: "/collection",
  },
  {
    title: {
      default: "SRC-20 TOKENS",
      tablet: "TOKENS",
    },
    href: "/src20",
  },
  {
    title: {
      default: "EXPLORER",
      tablet: "EXPLORER",
    },
    href: "/explorer",
  },
  {
    title: {
      default: "TOOLS",
      tablet: "TOOLS",
    },
    href: "#",
    subLinks: [
      { title: "STAMPING", href: "/tool/stamp/stamping" },
      { title: "TRANSFER", href: "/tool/stamp/transfer" },
      { title: "DEPLOY", href: "/tool/src20/deploy" },
      { title: "MINT", href: "/tool/src20/mint" },
      { title: "TRANSFER", href: "/tool/src20/transfer" },
      { title: "REGISTER", href: "/tool/src101/mint" },
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
    title: "EXPLORER",
    href: "/explorer",
  },
];

/* ===== MAIN HEADER COMPONENT ===== */
export function Header() {
  const [open, setOpen] = useState(false);
  const [currentPath, setCurrentPath] = useState<string | null>(null);
  const [toolsOpen, setToolsOpen] = useState(false);

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

  /* ===== MENU CLOSE FUNCTION ===== */
  const closeMenu = () => {
    setTimeout(() => {
      setOpen(false);
      // Close tools section after drawer is closed
      setTimeout(() => {
        if (toolsOpen) {
          setToolsOpen(false);
        }
      }, 500); // Wait for drawer close animation to finish
    }, 500);
  };

  /* ===== MENU TOGGLE FUNCTION ===== */
  const toggleMenu = () => {
    if (open) {
      closeMenu();
    } else {
      setOpen(true);
      if (toolsOpen) {
        setToolsOpen(false);
      }
    }
  };

  /* ===== TOOLS TOGGLE FUNCTION ===== */
  const toggleTools = () => {
    if (toolsOpen) {
      // When closing
      setTimeout(() => {
        setToolsOpen(false);
      }, 250);
    } else {
      // When opening
      setTimeout(() => {
        setToolsOpen(true);
      }, 250);
    }
  };

  /* ===== NAVIGATION LINKS RENDERER ===== */
  const renderNavLinks = (isMobile = false) => {
    // Choose which navigation links to use based on mobile/desktop view
    const filteredNavLinks = isMobile ? mobileNavLinks : desktopNavLinks;

    return (
      <>
        {/* Map through each navigation link */}
        {filteredNavLinks.map((link) => (
          // Main container for each nav item
          <div
            // Generate unique key based on title type
            key={typeof link.title === "string"
              ? link.title
              : link.title.default}
            // Base styles for nav container with conditional mobile styling
            className={`relative group ${isMobile ? "" : ""}`}
          >
            {/* Main navigation link */}
            <a
              // Only set href if there are no sublinks (dropdown items)
              href={link.subLinks ? undefined : link.href}
              // Click handler for navigation
              onClick={() => {
                if (link.subLinks) return; // Don't navigate if has dropdown
                if (!link?.href) return; // Don't navigate if no href
                toggleMenu(); // Close mobile menu if open
                setCurrentPath(link?.href ? link?.href : null); // Update current path
              }}
              // Complex conditional styling for mobile/desktop
              className={`inline-block w-full ${
                isMobile
                  ? ` ${
                    // Title of menus
                    link.subLinks ? navLinkGrey : navLinkGreyLD}`
                  : navLinkPurple
              }`}
            >
              {/* Hidden tablet version of title */}
              <span className="tablet:block min-[1180px]:hidden">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.tablet}
              </span>
              {/* Visible default version of title */}
              <span className="hidden min-[1180px]:block">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.default}
              </span>
            </a>

            {/* Dropdown menu - only rendered on desktop */}
            {link.subLinks && (
              isMobile
                ? null
                : (
                  <div className="hidden group-hover:flex flex-col absolute top-full left-1/2 -translate-x-1/2 min-w-[calc(100%+36px)] z-10 pt-1 pb-3.5 px-[18px] space-y-1 whitespace-nowrap backdrop-blur-md bg-gradient-to-b from-transparent to-[#000000]/30 rounded-b-lg">
                    {link.subLinks?.map((subLink) => (
                      <a
                        key={subLink.href}
                        href={subLink.href}
                        onClick={() => {
                          setCurrentPath(subLink?.href ? subLink?.href : null);
                        }}
                        className={`font-semibold text-center text-xs transition-colors duration-300 ${
                          currentPath === subLink.href
                            ? "text-sm text-stamp-purple-bright hover:text-stamp-purple"
                            : "text-sm text-stamp-purple hover:text-stamp-purple-bright"
                        }`}
                      >
                        {subLink.title}
                      </a>
                    ))}
                  </div>
                )
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
        <div className="tablet:hidden block relative -ml-1">
          <HamburgerMenuIcon isOpen={open} onClick={toggleMenu} />
        </div>
      </div>

      {/* ===== DESKTOP NAVIGATION ===== */}
      <div className="hidden tablet:flex justify-between items-center gap-6">
        {renderNavLinks()}
        <ConnectButton />
      </div>

      {/* ===== MOBILE NAVIGATION DRAWER ===== */}
      <div
        className={`flex tablet:hidden flex-col justify-between
           fixed top-0 right-0 left-auto w-full min-[420px]:w-[380px] h-screen z-30
           bg-gradient-to-b from-[#000000]/60 via-[#000000]/80 to-[#000000]/100 backdrop-blur-md
           shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.5)]
           transition-transform duration-500 ease-in-out will-change-transform
           overflow-y-auto overflow-x-hidden scrollbar-black
         ${open ? "translate-x-0" : "translate-x-full"}`}
        id="navbar-collapse"
      >
        {/* ===== MOBILE MENU LINKS AND CONNECT BUTTON ===== */}
        <div className="flex flex-col h-full">
          <div className="flex pt-[30px] px-9">
            <CloseIcon
              size="sm"
              weight="bold"
              color="greyGradient"
              isOpen={open}
              onClick={() => {
                if (open) {
                  closeMenu();
                }
              }}
            />
          </div>
          <div className="flex flex-col flex-1 items-start p-9 gap-3">
            {renderNavLinks(true)}
          </div>

          <div className="flex flex-col w-full sticky bottom-0
          bg-gradient-to-b from-[#000000]/33 via-[#000000]/66 to-[#000000]/100">
            {/* Tools section with gear icon */}
            <div className="flex w-full justify-between py-6 px-9">
              <div className="flex justify-start items-end -ml-1">
                <GearIcon
                  size="md"
                  weight="normal"
                  color="greyLogicDL"
                  isOpen={toolsOpen}
                  onToggle={toggleTools}
                />
              </div>
              <div
                className={`flex justify-end items-center transition-opacity duration-100
                  ${toolsOpen ? "opacity-0" : "opacity-100"}`}
                style={{
                  transitionDelay: toolsOpen ? "0ms" : "425ms",
                }}
              >
                <ConnectButton />
              </div>
            </div>

            <div
              className={`overflow-hidden transition-all duration-500 ease-in-out
                ${
                toolsOpen ? "max-h-[260px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="flex flex-col pl-9 pb-9 gap-3">
                {toolLinks.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      toggleMenu();
                      setCurrentPath(link.href);
                    }}
                    className={`font-bold transition-colors duration-300 ${
                      currentPath === link.href
                        ? "text-base text-stamp-grey-darker hover:text-stamp-grey-light"
                        : "text-base text-stamp-grey-light hover:!text-stamp-grey-darker"
                    }`}
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}

/* ===== DROPDOWN SUBLINKS FOR MOBILE AND DESKTOP ===== */
/*
<div
// Different dropdown styles for mobile/desktop
className={`${
  isMobile
    ? "hidden group-hover:flex flex-col z-10 w-full pt-3 gap-2 group"
    : "hidden group-hover:flex flex-col absolute top-full left-1/2 -translate-x-1/2 min-w-[calc(100%+36px)] z-10 pt-1 pb-3.5 px-[18px] space-y-1 whitespace-nowrap backdrop-blur-md bg-gradient-to-b from-transparent to-[#000000]/30 rounded-b-lg"
}`}
> */
/*
Map through dropdown items
{link.subLinks?.map((subLink) => (
  <a
    key={subLink.href}
    href={subLink.href}
    onClick={() => {
      toggleMenu(); // Close mobile menu
      setCurrentPath(subLink?.href ? subLink?.href : null); // Update current path
    }}
    // Complex conditional styling for active/inactive states
    className={`font-bold transition-colors duration-300 ${
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
  */

/* ===== OLD DESKTOP MENUS===== */
/*
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
      { title: "STAMPING", href: "/tool/stamp/stamping" },
      { title: "TRANSFER", href: "/tool/stamp/transfer" },
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
      { title: "DEPLOY", href: "/tool/src20/deploy" },
      { title: "MINT", href: "/tool/src20/mint" },
      { title: "TRANSFER", href: "/tool/src20/transfer" },
    ],
  },
  {
    title: {
      default: "BITNAME DOMAINS",
      tablet: "BITNAME",
    },
    href: "#",
    subLinks: [
      { title: "REGISTER", href: "/tool/src101/mint" },
    ],
  },
];
*/
