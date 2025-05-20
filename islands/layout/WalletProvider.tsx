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
      className={`${containerCard} group w-full cursor-pointer`}
      onClick={handleConnect}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <div className="flex items-center space-x-4">
        <div className="flex-shrink-0">
          <img
            src={providerInfo.logo.small}
            alt={`${providerInfo.name} logo`}
            className={`w-8 h-8 mobileLg:w-10 mobileLg:h-10 transition-all duration-300 ease-in-out transform ${
              isHovered ? "scale-110" : ""
            }`}
          />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-base mobileLg:text-lg font-bold text-white truncate group-hover:text-stamp-purple-bright">
            {providerInfo.name}
          </p>
        </div>
        <div className="inline-flex items-center text-xs mobileLg:text-sm font-medium text-stamp-grey-dark group-hover:text-stamp-purple-bright">
          CONNECT
        </div>
      </div>
    </div>
  );
}
