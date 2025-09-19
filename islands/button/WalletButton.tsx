// KEEP file for reference on the handleUpdateDisplayName to move into the new wallet / dashboard page
// UPDATE COMMENTARY
import { Button } from "$button";
import { walletContext } from "$client/wallet/wallet.ts";
import { DEFAULT_WALLET_CONNECTORS } from "$constants";
import { Icon } from "$icon";
import { WalletProvider } from "$islands/layout/WalletProvider.tsx";
import { ConnectWalletModal } from "$islands/modal/ConnectWalletModal.tsx";
import { closeModal, openModal } from "$islands/modal/states.ts";
import { glassmorphism } from "$layout";
import { abbreviateAddress } from "$lib/utils/ui/formatting/formatUtils.ts";
import { navSublinkPurple, valueDark, valueDarkSm } from "$text";
import { useEffect, useState } from "preact/hooks";

interface WalletButtonProps {
  onOpenDrawer?: (content: "wallet") => void;
  onCloseDrawer?: () => void;
}

/* ===== MAIN WALLET MODAL COMPONENT ===== */
export const WalletButton = (
  { onOpenDrawer, onCloseDrawer }: WalletButtonProps,
) => {
  const connectors = DEFAULT_WALLET_CONNECTORS;

  const { wallet, isConnected, disconnect } = walletContext;
  const { address } = wallet;
  const [path, setPath] = useState<string | null>(null);

  /* ===== PATH INITIALIZATION ===== */
  useEffect(() => {
    // SSR-safe browser environment check
    if (typeof globalThis === "undefined" || !globalThis?.location) {
      return; // Cannot access location during SSR
    }
    setPath(globalThis.location.pathname?.split("/")[1] || null);
  }, []);

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
    <div class="flex flex-col flex-1 items-start py-9 mobileLg:py-6 px-9 mobileLg:px-6 gap-5">
      {isConnected && address
        ? (
          <>
            {/* Address Display */}
            <div class="text-center">
              <h6 class={valueDark}>
                {abbreviateAddress(address, 10)}
              </h6>
            </div>

            {/* Dashboard Button */}
            <Button
              variant="text"
              color="custom"
              size="lg"
              onClick={() => {
                if (isConnected && address) {
                  // SSR-safe browser environment check
                  if (
                    typeof globalThis === "undefined" ||
                    !globalThis?.location
                  ) {
                    return; // Cannot navigate during SSR
                  }
                  globalThis.location.href = `/wallet/${address}`;
                }
              }}
              class="gray-gradient3-hover w-full"
            >
              DASHBOARD
            </Button>

            {/* Disconnect Button */}
            <Button
              variant="text"
              color="custom"
              size="lg"
              onClick={() => walletSignOut()}
              class="gray-gradient3-hover w-full"
            >
              DISCONNECT
            </Button>
          </>
        )
        : (
          <Button
            variant="text"
            color="custom"
            size="lg"
            onClick={handleOpenModal}
            class="!justify-center gray-gradient3-hover w-full"
          >
            CONNECT WALLET
          </Button>
        )}
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
