import { ComponentChildren } from "preact";
import { WALLET_PROVIDERS, WalletProviderKey } from "$lib/utils/constants.ts";
import { WalletConnector } from "./connectors/Wallet.connector.tsx";
import { showConnectWalletModal } from "$client/wallet/wallet.ts";

interface Props {
  connectors: ComponentChildren[];
  toggleModal: () => void;
  handleCloseModal: (event: MouseEvent) => void;
}

export const ConnectorsModal = (
  { connectors, toggleModal, handleCloseModal }: Props,
) => {
  console.log("Rendering ConnectorsModal with connectors:", connectors);

  const closeModal = () => {
    toggleModal();
    showConnectWalletModal.value = false;
  };

  return (
    <div
      class={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm ${
        showConnectWalletModal.value ? "" : "hidden"
      }`}
      onClick={handleCloseModal}
    >
      <div class="relative w-full max-w-2xl h-auto bg-[#0B0B0B] rounded-lg shadow overflow-hidden p-4 md:p-6 flex flex-col gap-6">
        <img
          onClick={closeModal}
          src="/img/wallet/icon-close.svg"
          class="w-6 h-6 absolute top-6 right-6 cursor-pointer"
          alt="Close modal"
        />

        <h3 class="text-5xl font-black purple-gradient1">
          CONNECT<br />
          <span className="text-4xl font-extralight text-[#AA00FF]">
            YOUR WALLET
          </span>
        </h3>

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-4 items-center">
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
  );
};
