// KEEP file for reference on the handleUpdateDisplayName to move into the new wallet / dashboard page
// UPDATE COMMENTARY
import { walletContext } from "$client/wallet/wallet.ts";
import { DEFAULT_WALLET_CONNECTORS } from "$constants";
import { Icon } from "$icon";
import { WalletProvider } from "$islands/layout/WalletProvider.tsx";
import { ConnectWalletModal } from "$islands/modal/ConnectWalletModal.tsx";
import { closeModal, openModal } from "$islands/modal/states.ts";
import { glassmorphism, glassmorphismL2 } from "$layout";
import { abbreviateAddress } from "$lib/utils/ui/formatting/formatUtils.ts";
import { tooltipIcon } from "$notification";
import {
  labelLg,
  labelXs,
  navLinkGreyLD,
  navSublinkPurple,
  valueDarkSm,
  valueLg,
} from "$text";
import { useEffect, useRef, useState } from "preact/hooks";

interface WalletLink {
  title: string;
  href?: string;
}

interface WalletButtonProps {
  onOpenDrawer?: (content: "wallet") => void;
  onCloseDrawer?: () => void;
}

/* ===== WALLET CONFIGURATION ===== */
const getWalletLinks = (address: string): WalletLink[] => [
  { title: "DASHBOARD", href: `/wallet/${address}` },
  { title: "DISCONNECT" },
];

/* ===== MAIN WALLET MODAL COMPONENT ===== */
export const WalletButton = (
  { onOpenDrawer, onCloseDrawer }: WalletButtonProps,
) => {
  const connectors = DEFAULT_WALLET_CONNECTORS;

  const { wallet, isConnected, disconnect } = walletContext;
  const { address, btcBalance } = wallet;
  const [path, setPath] = useState<string | null>(null);

  /* ===== COPY STATE ===== */
  const [showCopied, setShowCopied] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);

  /* ===== REFS ===== */
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  /* ===== PATH INITIALIZATION ===== */
  useEffect(() => {
    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot access location during SSR
    }
    setPath(globalThis.location.pathname?.split("/")[1] || null);
  }, []);

  /* ===== COPY CLEANUP EFFECT ===== */
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  /* ===== COPY EVENT HANDLERS ===== */
  const handleCopyMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = copyButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleCopyMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setShowCopied(false);
    setAllowTooltip(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(address);
      setShowCopied(true);
      setIsTooltipVisible(false);
      setAllowTooltip(false);

      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setShowCopied(false);
      }, 1500);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  /* ===== MODAL VISIBILITY HANDLER ===== */
  const handleOpenModal = () => {
    if (!isConnected) {
      try {
        // Create the providers array first
        const providerComponents = connectors.map((key) => (
          <WalletProvider
            key={key}
            providerKey={key}
          />
        ));

        // Create modal content with the array directly
        const modalContent = (
          <ConnectWalletModal
            connectors={providerComponents}
            handleClose={closeModal}
          />
        );

        // Open modal
        openModal(modalContent, "slideUpDown");
      } catch (error) {
        console.error("Error in handleOpenModal:", error);
      }
    }
  };

  /* ===== WALLET SIGN OUT FUNCTION ===== */
  const walletSignOut = () => {
    disconnect();
    onCloseDrawer?.();
    if (path === "wallet" && typeof globalThis !== "undefined") {
      globalThis.history.pushState({}, "", "/");
      globalThis.location.reload();
    }
  };

  /* ===== WALLET ICON CLICK HANDLER ===== */
  const handleWalletIconClick = () => {
    if (!isConnected) {
      handleOpenModal();
    } else {
      // On mobile/tablet, open wallet drawer; on desktop, do nothing (dropdown handles it)
      if (typeof globalThis !== "undefined" && globalThis.innerWidth < 1024) {
        onOpenDrawer?.("wallet");
      }
    }
  };

  // Wallet drawer content
  const walletDrawerContent = (
    <div class="flex flex-col h-full px-9 mobileLg:px-6">
      {/* Top - Main navigation content */}
      <div class="flex flex-col flex-1 items-start pt-9 mobileLg:pt-6 gap-5">
        <div
          class={`flex-col ${glassmorphismL2} w-full -mt-3 mb-3 px-3 py-2 space-y-1`}
        >
          <div class="flex items-center gap-3">
            <h6 class={valueDarkSm}>
              {abbreviateAddress(address, 12)}
            </h6>
            <div
              ref={copyButtonRef}
              class="relative"
              onMouseEnter={handleCopyMouseEnter}
              onMouseLeave={handleCopyMouseLeave}
            >
              <Icon
                type="iconButton"
                name="copy"
                weight="normal"
                size="xsR"
                color="greyDark"
                onClick={copy}
              />
              <div
                class={`${tooltipIcon} ${
                  isTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
              >
                COPY ADDY
              </div>
              <div
                class={`${tooltipIcon} ${
                  showCopied ? "opacity-100" : "opacity-0"
                }`}
              >
                ADDY COPIED
              </div>
            </div>
          </div>
          <div class="flex items-center gap-2.5">
            <Icon
              type="icon"
              name="bitcoins"
              weight="normal"
              size="xs"
              color="greyDark"
            />
            <h6 class={valueLg}>
              {btcBalance.total.toFixed(8)} <span class={labelLg}>BTC</span>
            </h6>
          </div>
        </div>

        {getWalletLinks(address).map((link) => (
          <a
            key={link.title}
            href={link.href}
            onClick={() => {
              if (link.title === "DISCONNECT") {
                walletSignOut();
              }
            }}
            class={`inline-block w-full ${navLinkGreyLD}`}
          >
            {link.title}
          </a>
        ))}

        {/* Bottom - Counterparty version */}
        <div class="sticky bottom-0 w-full mt-auto pb-9 mobileLg:pb-6 bg-[#0a070a]/80 shadow-[0_-36px_36px_-6px_rgba(10,7,10,1)]">
          <div class={`flex items-end`}>
            <CounterpartyVersion />
          </div>
        </div>
      </div>
    </div>
  );

  /* ===== COMPONENT RENDER ===== */
  return {
    // The wallet icon component
    icon: (
      <div class="relative z-10">
        {/* ===== CONNECT WALLET BUTTON ===== */}
        {!(isConnected && address) && (
          <div class={`mt-0.5 -mx-0.5`}>
            <Icon
              type="iconButton"
              name="wallet"
              weight="normal"
              size="mdR"
              color="purple"
              colorAccent="#660099"
              colorAccentHover="#8800CC"
              onClick={handleWalletIconClick}
            />
          </div>
        )}

        {/* ===== CONNECTED WALLET DISPLAY ===== */}
        {isConnected && address && (
          <>
            {/* ===== MOBILE/TABLET WALLET ICON ===== */}
            <div class="tablet:hidden">
              <Icon
                type="iconButton"
                name="wallet"
                weight="normal"
                size="md"
                color="purple"
                colorAccent="#999999CC"
                colorAccentHover="#8800CC"
                onClick={handleWalletIconClick}
              />
            </div>

            {/* ===== DESKTOP WALLET ICON AND DROPDOWN MENU ===== */}
            <div class="mt-0.5 hidden tablet:flex items-center relative group">
              <Icon
                type="iconButton"
                name="wallet"
                weight="normal"
                size="sm"
                color="purple"
                colorAccent="#999999CC"
                colorAccentHover="#8800CC"
                onClick={handleWalletIconClick}
              />
              <div
                class={`hidden group-hover:flex flex-col absolute
                   top-[calc(100%+6px)] right-0 z-20
                  min-w-[calc(100%+36px)] py-3.5 px-5 ${glassmorphism} !rounded-t-none`}
              >
                <div class="flex flex-col gap-1 text-center whitespace-nowrap">
                  <h6 class={`${valueDarkSm} py-0.5`}>
                    {abbreviateAddress(address, 5)}
                  </h6>
                  <a
                    href={`/wallet/${address}`}
                    class={`${navSublinkPurple}`}
                  >
                    DASHBOARD
                  </a>
                  <a
                    onClick={() => walletSignOut()}
                    class={`${navSublinkPurple}`}
                  >
                    DISCONNECT
                  </a>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    ),
    // The wallet content for the drawer
    content: walletDrawerContent,
  };
};

function CounterpartyVersion() {
  const [version, setVersion] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    let cancelled = false;
    const fetchVersion = async () => {
      try {
        const res = await fetch("/api/v2/counterparty/version", {
          headers: { "X-CSRF-Token": "safe" },
        });
        const data = await res.json();
        if (!cancelled) {
          setVersion(data?.version ?? null);
        }
      } catch (_e) {
        if (!cancelled) setVersion(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchVersion();

    // Refresh periodically to keep up-to-date
    const interval = globalThis.setInterval(fetchVersion, 24 * 60 * 60 * 1000);
    return () => {
      cancelled = true;
      globalThis.clearInterval(interval);
    };
  }, []);

  return (
    <div class={`flex items-center`}>
      <Icon
        type="icon"
        name="version"
        weight="normal"
        size="xxs"
        color="greyDark"
        className="mb-[1px] mr-2.5"
      />
      <span class={labelXs}>
        COUNTERPARTY {loading
          ? <span class="animate-pulse">vXX.X.XX</span>
          : version
          ? <>v{version}</>
          : <>v N/A</>}
      </span>
    </div>
  );
}
