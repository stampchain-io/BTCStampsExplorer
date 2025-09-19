import { Icon } from "$icon";
import { glassmorphism } from "$layout";
import { getCSRFToken } from "$lib/utils/security/clientSecurityUtils.ts";
import { formatUSDValue } from "$lib/utils/ui/formatting/formatUtils.ts";
import {
  labelXs,
  navLinkGrey,
  navLinkGreyActive,
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
  const [btcPrice, setBtcPrice] = useState(0);
  const [recommendedFee, setRecommendedFee] = useState(6);
  const [isLoading, setIsLoading] = useState(true);

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

  /* ===== DATA FETCHING ===== */
  useEffect(() => {
    const fetchFees = async () => {
      try {
        const csrfToken = await getCSRFToken();

        const response = await fetch("/api/internal/fees", {
          headers: {
            "X-CSRF-Token": csrfToken,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch fees: ${response.status}`);
        }

        const data = await response.json();
        setBtcPrice(data.btcPrice);
        setRecommendedFee(data.recommendedFee);
        setIsLoading(false);
      } catch (err) {
        console.error("Fees fetch error:", err);
        setIsLoading(false);
      }
    };

    fetchFees();
  }, []);

  /* ===== HELPERS ===== */
  const displayPrice = formatUSDValue(btcPrice).toLocaleString();
  const displayFee = typeof recommendedFee === "number" ? recommendedFee : "0";

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
      <div class="flex flex-col space-y-0 w-full">
        {/* STAMPS Section */}
        <div class="flex flex-col space-y-4">
          <h6 class={`${labelXs} -mb-7 text-right`}>
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
              class={`inline-block w-full ${
                isActive(link.href) ? navLinkGreyActive : navLinkGrey
              }`}
            >
              {link.title}
            </a>
          ))}
        </div>

        {/* TOKENS Section */}
        <div class="flex flex-col space-y-4">
          <h6 class={`${labelXs} mt-3 -mb-7 text-right`}>
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
              class={`inline-block w-full ${
                isActive(link.href) ? navLinkGreyActive : navLinkGrey
              }`}
            >
              {link.title}
            </a>
          ))}
        </div>

        {/* BITNAME Section */}
        <div class="flex flex-col space-y-4">
          <h6 class={`${labelXs} mt-3 -mb-7 text-right`}>
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
                class={`inline-block w-full ${
                  isActive(link.href) ? navLinkGreyActive : navLinkGrey
                }`}
              >
                {link.title}
              </a>
            ))}
        </div>
      </div>
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
            colorAccent="#660099"
            colorAccentHover="#8800CC"
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
            colorAccent="#660099"
            colorAccentHover="#8800CC"
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
      <div class="flex flex-col h-full">
        {/* Main navigation content */}
        <div class="flex flex-col flex-1 items-start py-9 mobileLg:py-6 px-9 mobileLg:px-6 gap-3">
          {renderToolLinks()}
        </div>

        {/* Sub navigation links at bottom */}
        <div class="sticky bottom-0 pb-9 mobileLg:pb-6 px-9 mobileLg:px-6 bg-[#0a070a]/80 shadow-[0_-36px_36px_-6px_rgba(10,7,10,1)]">
          {/* ===== PRICE/FEE INFO ===== */}
          <div class="flex-col -space-y-3
          font-light text-sm text-stamp-grey">
            <p>
              <span class="text-stamp-grey-darker">FEE</span>&nbsp;
              {isLoading
                ? <span class="animate-pulse">XX</span>
                : <span class="font-medium">{displayFee}</span>} SAT/vB
            </p>
            <p>
              <span class="text-stamp-grey-darker">BTC</span>&nbsp;
              {isLoading
                ? <span class="animate-pulse">XXX,XXX</span>
                : <span class="font-medium">{displayPrice}</span>} USD
            </p>
          </div>
        </div>
      </div>
    ),
    // Current path for external use
    currentPath,
  };
}
