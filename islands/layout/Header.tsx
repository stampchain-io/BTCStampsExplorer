import { useEffect, useState } from "preact/hooks";
import { ConnectWallet } from "$islands/Wallet/ConnectWallet.tsx";
import { Icon } from "$icons";
import { HamburgerMenuIcon } from "$components/icons/MenuIcon.tsx";
import { CloseIcon } from "$components/icons/Icon.tsx";
import {
  logoPurpleLDLink,
  navLinkGrey,
  navLinkGreyLD,
  navLinkPurpleThick,
} from "$text";
import { CollapsibleSection } from "$components/shared/Collapsible.tsx";

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
  { title: "STAMPING", href: "/stamping/stamp" },
  { title: "TRANSFER STAMP", href: "/stamping/stamp/transfer" },
  { title: "DEPLOY TOKEN", href: "/stamping/src20/deploy" },
  { title: "MINT TOKEN", href: "/stamping/src20/mint" },
  { title: "TRANSFER TOKEN", href: "/stamping/src20/transfer" },
  { title: "REGISTER BITNAME", href: "/stamping/src101/mint" },
];

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
      }, 150);
    } else {
      // When opening
      setTimeout(() => {
        setToolsOpen(true);
      }, 150);
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
                  : navLinkPurpleThick
              }`}
            >
              {/* Hidden tablet version of title */}
              <span className="hidden">
                {typeof link.title === "string"
                  ? link.title
                  : link.title.tablet}
              </span>
              {/* Visible default version of title */}
              <span className="">
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
                        className={`font-bold transition-colors duration-300 ${
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
      <div className="hidden tablet:flex justify-between items-center gap-9">
        {renderNavLinks()}
        <ConnectWallet />
      </div>

      {/* ===== MOBILE NAVIGATION DRAWER ===== */}
      <div
        className={`flex tablet:hidden flex-col justify-between
           fixed top-0 right-0 left-auto w-full min-[420px]:w-[380px] h-screen z-30
           bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 backdrop-blur-md
           pt-[30px] shadow-[-12px_0_12px_-6px_rgba(0,0,0,0.5)]
           transition-transform duration-500 ease-in-out will-change-transform
           overflow-y-auto overflow-x-hidden scrollbar-black
         ${open ? "translate-x-0" : "translate-x-full"}`}
        id="navbar-collapse"
      >
        {/* ===== MOBILE MENU LINKS AND CONNECT BUTTON ===== */}
        <div className="flex flex-col h-full">
          <div className="flex pl-6">
            <CloseIcon
              isOpen={open}
              onClick={() => {
                if (open) {
                  closeMenu();
                }
              }}
            />
          </div>
          <div className="flex flex-col flex-1 items-start pt-6 pl-6 gap-4">
            {renderNavLinks(true)}
          </div>

          <div className="flex flex-col w-full sticky bottom-0 backdrop-blur-md">
            {/* Tools section with gear icon */}
            <div className="flex w-full justify-between pt-6 pb-6 pl-9 pr-7">
              <div className="flex justify-start items-end">
                <Icon
                  type="iconLink"
                  name="gear"
                  weight="normal"
                  size="md"
                  color="grey"
                  className="-ml-1 fill-stamp-grey-darker"
                  onClick={(e) => {
                    const target = e.currentTarget as HTMLElement;
                    target.style.transition = "all 600ms ease-in-out";
                    // If currently closed (toolsOpen is false), we're opening
                    if (!toolsOpen) {
                      target.style.transform = "rotate(180deg)";
                    } else {
                      target.style.transform = "rotate(0deg)";
                    }
                    toggleTools();
                  }}
                />
              </div>
              <div
                className={`flex justify-end items-center transition-opacity duration-100
                  ${toolsOpen ? "opacity-0" : "opacity-100"}`}
                style={{
                  transitionDelay: toolsOpen ? "0ms" : "450ms",
                }}
              >
                <ConnectWallet />
              </div>
            </div>

            {/* Collapsible tools section */}
            <CollapsibleSection
              title="Tools"
              section="tools"
              expanded={toolsOpen}
              toggle={toggleTools}
              variant="collapsibleTools"
            >
              <div className="flex flex-col gap-3">
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
                        ? "text-base text-stamp-grey-light hover:text-stamp-grey py-1"
                        : "text-base text-stamp-grey hover:text-stamp-grey-light py-1"
                    }`}
                  >
                    {link.title}
                  </a>
                ))}
              </div>
            </CollapsibleSection>
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
{
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
}
