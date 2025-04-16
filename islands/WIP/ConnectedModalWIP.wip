/* ===== CONNECTED MODAL COMPONENT (WIP) ===== */
import {
  showConnectWalletModal,
  walletContext,
} from "$client/wallet/wallet.ts";

/* ===== TYPES ===== */
interface Props {
  toggleModal: () => void;
  handleCloseModal: (event: MouseEvent) => void;
}

/* ===== COMPONENT ===== */
export const ConnectedModal = ({ toggleModal, handleCloseModal }: Props) => {
  /* ===== EVENT HANDLERS ===== */
  const disconnectWallet = () => {
    console.log("Disconnecting wallet...");
    walletContext.disconnect();
    toggleModal();
    showConnectWalletModal.value = false;
  };

  /* ===== RENDER ===== */
  return (
    <div
      class={`fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black bg-opacity-50 backdrop-filter backdrop-blur-sm ${
        showConnectWalletModal.value ? "" : "hidden"
      }`}
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-2xl h-auto">
        {/* ===== MODAL CONTENT ===== */}
        <div class="relative bg-white rounded-lg shadow dark:bg-gray-700">
          {/* ===== HEADER SECTION ===== */}
          <div class="flex items-center justify-between p-4 tablet:p-5 border-b rounded-t dark:border-gray-600">
            <h3 class="text-xl font-semibold text-gray-900 dark:text-white">
              Wallet Connected
            </h3>
            <button
              onClick={() => {
                toggleModal();
                showConnectWalletModal.value = false;
              }}
              type="button"
              class="text-gray-400 bg-transparent hover:bg-gray-200 hover:text-gray-900 rounded-lg text-sm w-8 h-8 ms-auto inline-flex justify-center items-center dark:hover:bg-gray-600 dark:hover:text-white"
              data-modal-hide="default-modal"
            >
              <svg
                class="w-3 h-3"
                aria-hidden="true"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 14 14"
              >
                <path
                  stroke="currentColor"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                  stroke-width="2"
                  d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                />
              </svg>
              <span class="sr-only">Close modal</span>
            </button>
          </div>

          {/* ===== ACTIONS SECTION ===== */}
          <div class="grid mobileLg:grid-cols-2 items-center p-4 tablet:p-5 border-t border-gray-200 rounded-b dark:border-gray-600">
            <button
              onClick={disconnectWallet}
              class="block m-1 text-white border outline-1 border-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-transparent font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Disconnect
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
