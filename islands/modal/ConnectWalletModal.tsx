/* ===== CONNECT WALLET MODAL COMPONENT ===== */
import { ComponentChildren } from "preact";
import { WALLET_PROVIDERS, WalletProviderKey } from "$lib/utils/constants.ts";
import { WalletProviderBase } from "$islands/modal/WalletProviderBase.tsx";
import { showConnectWalletModal } from "$client/wallet/wallet.ts";
import { subtitlePurple, titlePurpleLD } from "$text";

/* ===== TYPES ===== */
interface Props {
  connectors: ComponentChildren[];
  toggleModal: () => void;
  handleCloseModal: (event: MouseEvent) => void;
}

/* ===== COMPONENT ===== */
export const ConnectWalletModal = (
  { connectors, toggleModal, handleCloseModal }: Props,
) => {
  /* ===== DEBUG LOGGING ===== */
  console.log("Rendering ConnectWalletModal with connectors:", connectors);

  /* ===== EVENT HANDLERS ===== */
  const closeModal = () => {
    toggleModal();
    showConnectWalletModal.value = false;
  };

  /* ===== RENDER ===== */
  return (
    <div
      // class={`fixed z-[150] inset-0 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#000000] bg-opacity-60 backdrop-filter backdrop-blur-md ${
      //   showConnectWalletModal.value ? "" : "hidden"
      // }`}
      // onClick={handleCloseModal}
    >
      <div class="relative flex flex-col w-[340px] tablet:w-[640px] h-fit dark-gradient-modal rounded-xl shadow-md p-6 overflow-hidden">
        {
          /* Close button - should be swapped to a close icon
        <img
          onClick={closeModal}
          src="/img/wallet/icon-close.svg"
          class="w-6 h-6 absolute top-6 right-6 cursor-pointer"
          alt="Close modal"
        /> */
        }

        {/* ===== HEADER SECTION ===== */}
        <h3 class={titlePurpleLD}>
          CONNECT
        </h3>
        <h4 class={`${subtitlePurple} text-left pb-3`}>
          YOUR WALLET
        </h4>

        {/* ===== WALLET PROVIDERS GRID ===== */}
        <div class="grid grid-cols-1 mobileLg:grid-cols-2 gap-6 items-center">
          {Object.keys(WALLET_PROVIDERS).map((providerKey) => (
            <WalletProviderBase
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
