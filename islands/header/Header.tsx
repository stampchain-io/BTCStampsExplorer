/* ===== HEADER COMPONENT ===== */
import { CloseIcon, Icon } from "$icon";
import { MenuButton } from "$islands/button/MenuButton.tsx";
import { SearchButton } from "$islands/button/SearchButton.tsx";
import { ToolsButton } from "$islands/button/ToolsButton.tsx";
import { WalletButton } from "$islands/button/WalletButton.tsx";
import {
  glassmorphism,
  glassmorphismOverlay,
  transitionTransform,
} from "$layout";
import { tooltipIcon } from "$notification";
import {
  navLinkGreyLD,
  navLinkGreyLDActive,
  navLinkPurple,
  navLinkPurpleActive,
} from "$text";
import { createPortal } from "preact/compat";
import { useEffect, useMemo, useRef, useState } from "preact/hooks";

/* ===== NAVIGATION LINK INTERFACE ===== */
interface NavLink {
  title: string | {
    default: string;
    tablet: string;
  };
  href?: string;
}

/* ===== TOOLS CONFIGURATION ===== */

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
  const [drawerContent, setDrawerContent] = useState<
    "menu" | "wallet" | "tools"
  >("menu");
  // Add tooltip state for close button
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [allowCloseTooltip, setAllowCloseTooltip] = useState(true);
  const [closeTooltipText, setCloseTooltipText] = useState("CLOSE");
  const closeTooltipTimeoutRef = useRef<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);

  // Single atomic dropdown state
  const [dropdownState, setDropdownState] = useState<{
    active: "tools" | "wallet" | null;
    toolsPos: { top: number; left: number } | null;
    walletPos: { top: number; left: number } | null;
  }>({
    active: null,
    toolsPos: null,
    walletPos: null,
  });
  const toolsButtonRef = useRef<HTMLDivElement>(null);
  const walletButtonRef = useRef<HTMLDivElement>(null);

  // Hover delay timeout
  const dropdownTimeoutRef = useRef<number | null>(null);

  // Scroll lock
  useEffect(() => {
    if (open) {
      document.documentElement.style.overflow = "hidden";
      document.body.style.overflow = "hidden";
      return;
    } else {
      const timer = setTimeout(() => {
        document.documentElement.style.overflow = "";
        document.body.style.overflow = "";
      }, 400); // Match drawer transition duration
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Add combined handler for keyboard shortcuts and click outside
  useEffect(() => {
    const handleCloseEvents = (e: KeyboardEvent | MouseEvent) => {
      // Handle keyboard shortcuts
      if (e.type === "keydown") {
        const keyEvent = e as KeyboardEvent;
        // Close on Escape key
        if (keyEvent.key === "Escape" && open) {
          e.preventDefault();
          closeMenu();
        }
      }

      // Handle click outside
      if (e.type === "mousedown" && open) {
        // Check if the click was outside the drawer
        if (
          drawerRef.current && !drawerRef.current.contains(e.target as Node)
        ) {
          closeMenu();
        }
      }
    };

    // Add event listeners
    document.addEventListener("keydown", handleCloseEvents);
    document.addEventListener("mousedown", handleCloseEvents);

    // Clean up event listeners
    return () => {
      document.removeEventListener("keydown", handleCloseEvents);
      document.removeEventListener("mousedown", handleCloseEvents);
    };
  }, [open]);

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

  // Add cleanup effect for tooltip timeout
  useEffect(() => {
    return () => {
      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleCloseMouseEnter = () => {
    if (allowCloseTooltip) {
      setCloseTooltipText("CLOSE");

      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }

      closeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsCloseTooltipVisible(true);
      }, 1500);
    }
  };

  const handleCloseMouseLeave = () => {
    if (closeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(closeTooltipTimeoutRef.current);
    }
    setIsCloseTooltipVisible(false);
    setAllowCloseTooltip(true);
  };

  /* ===== MENU CLOSE FUNCTION ===== */
  const closeMenu = () => {
    // Close menu by updating state
    setOpen(false);
  };

  /* ===== DRAWER CONTROL FUNCTIONS ===== */
  const openDrawer = (content: "menu" | "wallet" | "tools") => {
    setDrawerContent(content);
    setOpen(true);
  };

  /* ===== PORTAL DROPDOWN HANDLERS ===== */
  const handleToolsMouseEnter = () => {
    // Clear any existing timeout
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }

    // Calculate tools position
    let toolsPos = null;
    if (toolsButtonRef.current) {
      const rect = toolsButtonRef.current.getBoundingClientRect();
      toolsPos = {
        top: rect.bottom + 20,
        left: rect.right - 520 + 58,
      };
    }

    // Atomic state update - all changes happen together
    const newState = {
      active: "tools" as const,
      toolsPos: toolsPos,
      walletPos: null,
    };
    setDropdownState(newState);
  };

  const handleWalletMouseEnter = () => {
    // Clear any existing timeout
    if (dropdownTimeoutRef.current) {
      clearTimeout(dropdownTimeoutRef.current);
      dropdownTimeoutRef.current = null;
    }

    // Calculate wallet position
    let walletPos = null;
    if (walletButtonRef.current) {
      const rect = walletButtonRef.current.getBoundingClientRect();
      walletPos = {
        top: rect.bottom + 19,
        left: rect.right - 140 - 22,
      };
    }

    // Atomic state update - all changes happen together
    const newState = {
      active: "wallet" as const,
      toolsPos: null,
      walletPos: walletPos,
    };
    setDropdownState(newState);
  };

  const handleDropdownMouseLeave = () => {
    // Set timeout to close dropdown after delay
    dropdownTimeoutRef.current = setTimeout(() => {
      setDropdownState({
        active: null,
        toolsPos: null,
        walletPos: null,
      });
    }, 300); // 300ms delay
  };

  // Create a single wallet button instance to prevent state pollution
  const walletButtonInstance = useMemo(() => {
    return WalletButton({
      onOpenDrawer: openDrawer,
      onCloseDrawer: closeMenu,
    });
  }, [openDrawer, closeMenu]);

  /* ===== DRAWER RENDERER ===== */
  const renderDrawer = (type: "menu" | "wallet" | "tools") => {
    const isMenu = type === "menu";
    const isActive = drawerContent === type && open;

    const getContent = () => {
      switch (type) {
        case "menu":
          return MenuButton({ onOpenDrawer: openDrawer }).drawer;
        case "wallet":
          return WalletButton({
            onOpenDrawer: openDrawer,
            onCloseDrawer: closeMenu,
          }).drawer;
        case "tools":
          return ToolsButton({ onOpenDrawer: openDrawer }).drawer;
      }
    };

    return (
      <div
        ref={drawerContent === type ? drawerRef : null}
        class={`flex tablet:hidden flex-col justify-between
          fixed top-0 ${
          isMenu ? "left-0 right-auto" : "right-0 left-auto"
        } w-full min-[420px]:w-[340px] h-[100dvh] z-30
          ${
          isMenu
            ? "min-[420px]:rounded-l-xl min-[420px]:border-l-[1px] min-[420px]:border-r-0 min-[420px]:border-l-[#1b1b1b] min-[420px]:shadow-[-12px_0_12px_-6px_rgba(10,7,10,0.5)]"
            : "min-[420px]:rounded-r-xl min-[420px]:border-r-[1px] min-[420px]:border-l-0 min-[420px]:border-r-[#1b1b1b] min-[420px]:shadow-[12px_0_12px_-6px_rgba(10,7,10,0.5)]"
        }
          ${glassmorphismOverlay} ${transitionTransform} transition-transform will-change-transform
          overflow-y-auto overflow-x-hidden scrollbar-black
          ${
          isActive
            ? "translate-x-0"
            : isMenu
            ? "-translate-x-full"
            : "translate-x-full"
        }`}
        style="transition-timing-function: cubic-bezier(0.46,0.03,0.52,0.96);"
        id={`navbar-collapse-${type}`}
      >
        <div class="flex flex-col h-full">
          <div
            class={`flex pt-[34px] mobileLg:pt-[22px] px-9 ${
              isMenu ? "justify-end" : ""
            }`}
          >
            <div class="relative">
              <div
                class={`${tooltipIcon} ${
                  isCloseTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                {closeTooltipText}
              </div>
              <CloseIcon
                size="md"
                weight="normal"
                color="grey"
                onClick={() => {
                  if (open) {
                    closeMenu();
                  }
                }}
                onMouseEnter={handleCloseMouseEnter}
                onMouseLeave={handleCloseMouseLeave}
                aria-label="Close menu"
              />
            </div>
          </div>
          {getContent()}
        </div>
      </div>
    );
  };

  /* ===== NAVIGATION LINKS RENDERER ===== */
  const renderNavLinks = (isMobile = false) => {
    const isActive = (href?: string) => {
      if (!href || !currentPath) return false;
      const hrefPath = href.split("?")[0];
      return currentPath === hrefPath || currentPath.startsWith(`${hrefPath}/`);
    };

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
            class={`relative group ${isMobile ? "" : ""}`}
          >
            {/* Main navigation link */}
            <a
              href={link.href}
              // Click handler for navigation
              onClick={() => {
                if (!link?.href) return; // Don't navigate if no href
                if (open) {
                  closeMenu(); // Never open; only close if already open
                }
                setCurrentPath(link?.href ? link?.href : null); // Update current path
              }}
              // Complex conditional styling for mobile/desktop
              class={`inline-block w-full ${
                isMobile
                  ? isActive(link.href) ? navLinkGreyLDActive : navLinkGreyLD
                  : isActive(link.href)
                  ? navLinkPurpleActive
                  : navLinkPurple
              }`}
            >
              {/* Responsive text label */}
              {typeof link.title === "string" ? link.title : (
                isMobile
                  ? (
                    // On mobile drawer, always show default label
                    <span>{link.title.default}</span>
                  )
                  : (
                    // Show abbreviated label initially and default label at tablet - 1024px
                    <>
                      <span class="hidden tablet:inline">
                        {link.title.default}
                      </span>
                      <span class="inline tablet:hidden">
                        {link.title.tablet}
                      </span>
                    </>
                  )
              )}
            </a>
          </div>
        ))}
      </>
    );
  };

  /* ===== COMPONENT RENDER ===== */
  return (
    <header class="mobileLg:flex justify-between items-center max-w-desktop w-full mx-auto
     px-gutter-mobile mobileLg:px-gutter-tablet tablet:px-gutter-desktop
     pt-6 pb-9 mobileLg:pt-9 tablet:pb-14">
      {/* ===== LOGO, TEXT MENUS (DESKTOP) HAMBURGER MENU (MOBILE), TOOLS, SEARCH AND CONNECT BUTTON ===== */}
      <div
        class={`flex justify-between items-center w-full py-1.5 px-3 ${glassmorphism} relative z-header`}
      >
        {/* ===== MOBILE NAVIGATION ===== */}
        <div class="mobileLg:hidden flex items-center w-full">
          {/* Left: Menu Button */}
          <div class="flex items-center">
            {MenuButton({ onOpenDrawer: openDrawer }).icon}
          </div>

          {/* Center: Logo Icon */}
          <div class="flex-1 flex justify-center">
            <Icon
              type="iconButton"
              name="stampchain"
              size="lg"
              weight="light"
              color="purple"
              colorAccent="#660099"
              colorAccentHover="#8800CC"
              href="/home"
              f-partial="/home"
              onClick={() => setCurrentPath("home")}
            />
          </div>

          {/* Right: Search, Tools and Connect Buttons (Mobile: icons only) */}
          <div class="flex items-center gap-5">
            <SearchButton />
            {ToolsButton({ onOpenDrawer: openDrawer }).icon}
            {WalletButton({
              onOpenDrawer: openDrawer,
              onCloseDrawer: closeMenu,
            }).icon}
          </div>
        </div>

        {/* ===== DESKTOP LOGO ===== */}
        <div class="hidden mobileLg:flex items-center">
          <Icon
            type="iconButton"
            name="stampchain"
            size="lg"
            weight="light"
            color="purple"
            href="/home"
            f-partial="/home"
            onClick={() => setCurrentPath("home")}
          />
        </div>

        {/* ===== DESKTOP NAVIGATION ===== */}
        <div class="hidden mobileLg:flex items-center w-full">
          {/* Left: Logo (already positioned) */}

          {/* Center: Navigation Links */}
          <div class="flex-1 flex justify-center">
            <div class="flex items-center gap-5 tablet:gap-[30px]">
              {renderNavLinks()}
            </div>
          </div>

          {/* Right: Search, Tools and Connect Buttons (Desktop with dropdowns) */}
          <div class="flex items-center gap-5">
            <div class="relative group">
              <SearchButton />
            </div>
            <div
              class="relative group"
              ref={toolsButtonRef}
              onMouseEnter={handleToolsMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              {ToolsButton({ onOpenDrawer: openDrawer }).icon}
            </div>
            <div
              class="relative group"
              ref={walletButtonRef}
              onMouseEnter={handleWalletMouseEnter}
              onMouseLeave={handleDropdownMouseLeave}
            >
              {WalletButton({
                onOpenDrawer: openDrawer,
                onCloseDrawer: closeMenu,
              }).icon}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE NAVIGATION DRAWERS ===== */}
      {renderDrawer("menu")}
      {renderDrawer("tools")}
      {renderDrawer("wallet")}

      {/* ===== PORTAL DROPDOWNS ===== */}
      {(() => {
        const shouldRenderTools = dropdownState.active === "tools" &&
          dropdownState.toolsPos;

        return shouldRenderTools && createPortal(
          <div
            class={`hidden tablet:block fixed z-dropdown w-[520px] py-3.5 px-5 whitespace-nowrap ${glassmorphism}`}
            style={{
              top: `${dropdownState.toolsPos!.top}px`,
              left: `${dropdownState.toolsPos!.left}px`,
            }}
            onMouseEnter={() => {
              // Clear timeout when hovering over dropdown
              if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleDropdownMouseLeave}
          >
            <div class="grid grid-cols-5 w-full">
              {ToolsButton({ onOpenDrawer: openDrawer }).dropdown}
            </div>
          </div>,
          document.body,
        );
      })()}

      {(() => {
        const shouldRenderWallet = dropdownState.active === "wallet" &&
          dropdownState.walletPos;

        return shouldRenderWallet && createPortal(
          <div
            class={`hidden tablet:block fixed z-dropdown min-w-[140px] py-3.5 px-5 justify-end whitespace-nowrap ${glassmorphism}`}
            style={{
              top: `${dropdownState.walletPos!.top}px`,
              left: `${dropdownState.walletPos!.left}px`,
            }}
            onMouseEnter={() => {
              // Clear timeout when hovering over dropdown
              if (dropdownTimeoutRef.current) {
                clearTimeout(dropdownTimeoutRef.current);
                dropdownTimeoutRef.current = null;
              }
            }}
            onMouseLeave={handleDropdownMouseLeave}
          >
            {(() => {
              return walletButtonInstance.isConnected
                ? walletButtonInstance.dropdown
                : null;
            })()}
          </div>,
          document.body,
        );
      })()}
    </header>
  );
}
