import { Icon } from "$icon";
import { containerStickyBottom } from "$layout";
import {
  navLinkGrey,
  navLinkGreyActive,
  navLinkGreyLD,
  navLinkGreyLDActive,
} from "$text";
import { useEffect, useState } from "preact/hooks";

interface NavLink {
  title: string;
  href?: string;
  subLinks?: NavLink[];
}

interface MenuButtonProps {
  onOpenDrawer: (content: "menu") => void;
}

/* ===== MOBILE NAVIGATION CONFIGURATION ===== */
const navLinks: NavLink[] = [
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

const subNavLinks: NavLink[] = [
  { title: "HOW-TO", href: "/howto" },
  { title: "FAQ", href: "/faq" },
  { title: "MEDIA", href: "/media" },
];

export function MenuButton({ onOpenDrawer }: MenuButtonProps) {
  const [currentPath, setCurrentPath] = useState<string | null>(null);

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

  const handleMenuClick = () => {
    onOpenDrawer("menu");
  };

  const isActive = (href?: string) => {
    if (!href || !currentPath) return false;
    const hrefPath = href.split("?")[0];
    return currentPath === hrefPath || currentPath.startsWith(`${hrefPath}/`);
  };

  const navigation = () => {
    return (
      <>
        {navLinks.map((link) => (
          <div key={link.title} class="relative group w-full">
            <a
              href={link.subLinks ? undefined : link.href}
              onClick={() => {
                if (link.subLinks) {
                  return;
                }
                if (!link?.href) {
                  return;
                }
                setCurrentPath(link.href);
              }}
              class={`inline-block w-full ${
                link.subLinks
                  ? navLinkGrey
                  : isActive(link.href)
                  ? navLinkGreyLDActive
                  : navLinkGreyLD
              }`}
            >
              {link.title}
            </a>
          </div>
        ))}
      </>
    );
  };

  const subnavigation = () => {
    return (
      <div class="flex flex-col gap-3 -mb-1.5">
        {subNavLinks.map((link) => (
          <a
            key={link.title}
            href={link.href}
            onClick={() => {
              if (link?.href) {
                setCurrentPath(link.href);
              }
            }}
            class={`${isActive(link.href) ? navLinkGreyActive : navLinkGrey}`}
          >
            {link.title}
          </a>
        ))}
      </div>
    );
  };

  return {
    // The hamburger icon component
    icon: (
      <Icon
        type="iconButton"
        name="menu"
        weight="normal"
        size="md"
        color="purple"
        isOpen={false}
        onClick={handleMenuClick}
      />
    ),
    // The menu drawer content
    drawer: (
      <div class="flex flex-col h-full px-9 tablet:px-6">
        {/* Top - Main navigation content */}
        <div class="flex flex-col flex-1 items-start pt-9 tablet:pt-6 gap-5">
          {navigation()}
        </div>

        {/* Bottom - Sub navigation content */}
        <div class={containerStickyBottom}>
          {subnavigation()}
        </div>
      </div>
    ),
    // Current path for external use
    currentPath,
  };
}
