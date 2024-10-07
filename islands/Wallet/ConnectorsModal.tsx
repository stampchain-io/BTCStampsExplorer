import { ComponentChildren } from "preact";
import { WALLET_PROVIDERS, WalletProviderKey } from "$lib/utils/constants.ts";
import { WalletConnector } from "./connectors/Wallet.connector.tsx";
import { showConnectWalletModal } from "store/wallet/wallet.ts";

interface Props {
  connectors: ComponentChildren[];
  toggleModal: () => void;
  handleCloseModal: (event: MouseEvent) => void;
}

export const ConnectorsModal = (
  { connectors, toggleModal, handleCloseModal }: Props,
) => {
  console.log("Rendering ConnectorsModal with connectors:", connectors);

  return (
    <div
      class={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm ${
        showConnectWalletModal.value ? "" : "hidden"
      }`}
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-2xl h-auto">
        <div class="relative bg-[#0B0B0B] rounded-lg shadow overflow-hidden">
          <div class="flex items-center justify-between p-4 md:p-5 border-b rounded-t border-[#8800CC]">
            <h3 class="text-xl font-semibold text-white">
              Connect your wallet
            </h3>
            <button
              onClick={() => {
                toggleModal();
                showConnectWalletModal.value = false;
              }}
              type="button"
              class="text-gray-400 hover:bg-gray-600 hover:text-white rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center"
              aria-label="Close modal"
            >
              <svg
                class="w-3 h-3"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="M1 1l6 6m0 0l6 6M7 7l6-6M7 7L1 13"
                />
              </svg>
            </button>
          </div>

          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 items-center p-4 md:p-5 border-t border-[#8800CC] rounded-b">
            {Object.keys(WALLET_PROVIDERS).map((providerKey) => (
              <WalletConnector
                key={providerKey}
                providerKey={providerKey as WalletProviderKey}
                toggleModal={toggleModal}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
