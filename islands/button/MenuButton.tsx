import { Icon } from "$icon";
import { navLinkGrey, navLinkGreyLD, navLinkGreyLDActive } from "$text";
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

  const renderNavLinks = () => {
    return (
      <>
        {mobileNavLinks.map((link) => (
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

  return {
    // The hamburger icon component
    icon: (
      <Icon
        type="iconButton"
        name="menu"
        weight="bold"
        size="md"
        color="purple"
        isOpen={false}
        onClick={handleMenuClick}
      />
    ),
    // The menu content for the drawer
    content: (
      <div class="flex flex-col flex-1 items-start py-9 mobileLg:py-6 px-9 mobileLg:px-6 gap-5">
        {renderNavLinks()}
      </div>
    ),
    // Current path for external use
    currentPath,
  };
}
