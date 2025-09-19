import { Icon } from "$icon";
import { glassmorphism } from "$layout";
import {
  labelXs,
  navLinkGreyLD,
  navLinkGreyLDActive,
  navSublinkPurple,
  navSublinkPurpleActive,
} from "$text";
import { useEffect, useState } from "preact/hooks";

interface ToolLink {
  title: string;
  href: string;
}

interface ToolsButtonProps {
  onOpenDrawer: (content: "tools") => void;
}

/* ===== TOOLS CONFIGURATION ===== */
const toolLinks: ToolLink[] = [
  { title: "CREATE", href: "/tool/stamp/create" },
  { title: "SEND", href: "/tool/stamp/send" },
  { title: "DEPLOY", href: "/tool/src20/deploy" },
  { title: "MINT", href: "/tool/src20/mint" },
  { title: "TRANSFER", href: "/tool/src20/transfer" },
  { title: "REGISTER", href: "/tool/src101/mint" },
];

export function ToolsButton({ onOpenDrawer }: ToolsButtonProps) {
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

  const handleToolsClick = () => {
    // On mobile/tablet, open drawer; on desktop, do nothing (dropdown handles it)
    if (typeof globalThis !== "undefined" && globalThis.innerWidth < 1024) {
      onOpenDrawer("tools");
    }
  };

  const isActive = (href: string) => {
    if (!currentPath) return false;
    return currentPath === href || currentPath.startsWith(`${href}/`);
  };

  const renderToolLinks = () => {
    return (
      <>
        {toolLinks.map((link) => (
          <div key={link.title} class="relative group w-full">
            <a
              href={link.href}
              onClick={() => {
                setCurrentPath(link.href);
              }}
              class={`inline-block w-full ${
                isActive(link.href) ? navLinkGreyLDActive : navLinkGreyLD
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
    // The tools icon component with desktop dropdown
    icon: (
      <div class="relative group">
        {/* Mobile icon */}
        <div class="block tablet:hidden">
          <Icon
            type="iconButton"
            name="tools"
            weight="normal"
            size="custom"
            color="purple"
            className="w-[26px] h-[26px]"
            onClick={handleToolsClick}
          />
        </div>

        {/* Desktop icon  */}
        <div class="hidden tablet:block">
          <Icon
            type="iconButton"
            name="tools"
            weight="normal"
            size="custom"
            className="w-[22px] h-[22px]"
            color="purple"
            onClick={handleToolsClick}
          />
        </div>

        {/* Desktop dropdown menu */}
        <div
          class={`hidden mobileLg:group-hover:flex absolute top-[calc(100%+6px)] right-0 min-w-[400px] z-90 py-3.5 px-5 whitespace-nowrap ${glassmorphism} !rounded-t-none`}
        >
          <div class="grid grid-cols-3 gap-4 w-full">
            {/* Column 1: Left aligned - Stamp tools */}
            <div class="flex flex-col space-y-1 text-left">
              <h6 class={labelXs}>
                STAMPS
              </h6>
              {toolLinks.filter((link) =>
                link.href === "/tool/stamp/create" ||
                link.href === "/tool/stamp/send"
              ).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setCurrentPath(link.href);
                  }}
                  class={isActive(link.href)
                    ? navSublinkPurpleActive
                    : navSublinkPurple}
                >
                  {link.title}
                </a>
              ))}
            </div>

            {/* Column 2: Center aligned - Token tools */}
            <div class="flex flex-col space-y-1 text-center">
              <h6 class={labelXs}>
                TOKENS
              </h6>
              {toolLinks.filter((link) =>
                link.href === "/tool/src20/deploy" ||
                link.href === "/tool/src20/mint" ||
                link.href === "/tool/src20/transfer"
              ).map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  onClick={() => {
                    setCurrentPath(link.href);
                  }}
                  class={isActive(link.href)
                    ? navSublinkPurpleActive
                    : navSublinkPurple}
                >
                  {link.title}
                </a>
              ))}
            </div>

            {/* Column 3: Right aligned - Register */}
            <div class="flex flex-col space-y-1 text-right">
              <h6 class={labelXs}>
                BITNAME
              </h6>
              {toolLinks.filter((link) => link.href === "/tool/src101/mint")
                .map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => {
                      setCurrentPath(link.href);
                    }}
                    class={isActive(link.href)
                      ? navSublinkPurpleActive
                      : navSublinkPurple}
                  >
                    {link.title}
                  </a>
                ))}
            </div>
          </div>
        </div>
      </div>
    ),
    // The tools content for the drawer
    content: (
      <div class="flex flex-col flex-1 items-start py-9 mobileLg:py-6 px-9 mobileLg:px-6 gap-5">
        {renderToolLinks()}
      </div>
    ),
    // Current path for external use
    currentPath,
  };
}
