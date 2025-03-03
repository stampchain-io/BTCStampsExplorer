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
      // class={`fixed z-[150] inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#000000] bg-opacity-60 backdrop-filter backdrop-blur-md ${
      //   showConnectWalletModal.value ? "" : "hidden"
      // }`}
      // onClick={handleCloseModal}
    >
      <div class="relative flex flex-col w-full max-w-2xl h-auto p-3 mobileMd:p-6 dark-gradient-modal rounded-lg overflow-hidden">
        {
          /* <img
          onClick={closeModal}
          src="/img/wallet/icon-close.svg"
          class="w-6 h-6 absolute top-6 right-6 cursor-pointer"
          alt="Close modal"
        /> */
        }

        <h3 class="text-4xl mobileLg:text-5xl font-black purple-gradient3 text-center mobileLg:text-left">
          CONNECT
        </h3>
        <h4 class="text-3xl mobileLg:text-4xl font-extralight text-stamp-purple-highlight text-center mobileLg:text-left pb-1.5 mobileLg:pb-3 mobileMd:pb-6">
          YOUR WALLLET
        </h4>

        <div class="grid grid-cols-1 mobileLg:grid-cols-2 gap-3 mobileMd:gap-6 items-center">
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
