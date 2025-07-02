/* ===== WALLET PROVIDER MODAL COMPONENT ===== */
import { useState } from "preact/hooks";
import { WALLET_PROVIDERS, WalletProviderKey } from "$lib/utils/constants.ts";
import { unisatProvider } from "$client/wallet/unisat.ts";
import { showToast } from "$lib/utils/toastSignal.ts";
import { leatherProvider } from "$client/wallet/leather.ts";
import { okxProvider } from "$client/wallet/okx.ts";
import { tapWalletProvider } from "$client/wallet/tapwallet.ts";
import { phantomProvider } from "$client/wallet/phantom.ts";
import { containerCard } from "$layout";
import { closeForegroundModal, closeModal } from "$islands/modal/states.ts";
import type { BaseToast } from "$lib/utils/toastSignal.ts";

/* ===== TYPES ===== */
interface WalletProviderProps {
  providerKey: WalletProviderKey;
  onSuccess?: () => void;
}

/* ===== WALLET CONNECTORS CONFIG ===== */
const walletConnectors = {
  unisat: unisatProvider.connectUnisat,
  leather: leatherProvider.connectLeather,
  okx: okxProvider.connectOKX,
  tapwallet: tapWalletProvider.connectTapWallet,
  phantom: phantomProvider.connectPhantom,
} as const;

/* ===== MODAL COMPONENT ===== */
export function WalletProvider(
  { providerKey, onSuccess }: WalletProviderProps,
) {
  /* ===== HOOKS ===== */
  const providerInfo = WALLET_PROVIDERS[providerKey];

  /* ===== STATE ===== */
  const [isHovered, setIsHovered] = useState(false);

  /* ===== EVENT HANDLERS ===== */
  const handleConnect = async () => {
    try {
      const connectFunction = walletConnectors[providerKey];
      if (!connectFunction) {
        throw new Error(`Unsupported wallet provider: ${providerKey}`);
      }

      await connectFunction((message: string, type: BaseToast["type"]) => {
        showToast(message, type, type === "error" ? false : true);
        console.log(
          "[WalletProvider] Toast via connectFunction callback:",
          message,
          type,
        );
      });

      const modalContainer = document.getElementById(
        "animation-modal-container",
      );
      if (modalContainer) {
        modalContainer.classList.add("out");
      }

      if (onSuccess) {
        setTimeout(() => {
          closeForegroundModal();
          setTimeout(() => {
            if (onSuccess) onSuccess();
          }, 1);
        }, 600);
      } else {
        setTimeout(() => {
          closeModal();
        }, 600);
      }
    } catch (error: unknown) {
      const errorMessage = `Failed to connect to ${providerKey} wallet: ${
        error instanceof Error ? error.message : String(error)
      }`;
      showToast(errorMessage, "error", false);
      console.error(errorMessage);
    }
  };

  /* ===== RENDER ===== */
  return (
    <div
      onClick={handleConnect}
      role="button"
      aria-label={`Connect to ${providerInfo.name}`}
      className={`flex justify-between items-center p-4 ${containerCard}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* ===== PROVIDER NAME ===== */}
      <h6
        className={`font-extrabold text-lg uppercase tracking-wide ${
          isHovered ? "text-stamp-purple-bright" : "gray-gradient3"
        }`}
      >
        {providerInfo.name}
      </h6>

      {/* ===== PROVIDER LOGO ===== */}
      <img
        src={providerInfo.logo}
        alt={providerInfo.name}
        className="w-8 h-8"
      />
    </div>
  );
}
