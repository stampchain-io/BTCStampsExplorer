import { useState } from "preact/hooks";
import { ComponentChildren } from "preact";
import { computed } from "@preact/signals";

import { walletContext } from "store/wallet/wallet.ts";
import { short_address } from "utils/util.ts";
import { ConnectorsModal } from "./ConnectorsModal.tsx";
import { ConnectedModal } from "./ConnectedModal.tsx";

interface Props {
  connectors: ComponentChildren[];
}

export const WalletModal = ({ connectors }: Props) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const { wallet, isConnected } = walletContext;
  const { address } = wallet.value;

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
    console.log("Modal state:", !isModalOpen);
  };

  const handleCloseModal = (event) => {
    if (event.target === event.currentTarget) {
      setIsModalOpen(false);
    }
  };

  return (
    <>
      <button
        onClick={toggleModal}
        class="block bg-[#03A606] hover:bg-[#11FD15] px-5 py-2.5 rounded-lg font-medium text-sm text-center text-black"
        type="button"
      >
        {isConnected.value && address
          ? short_address(address)
          : "Connect Wallet"}
      </button>

      {isModalOpen && !isConnected.value && (
        <ConnectorsModal
          connectors={connectors}
          toggleModal={toggleModal}
          handleCloseModal={handleCloseModal}
        />
      )}
      {isModalOpen && isConnected.value && (
        <ConnectedModal
          toggleModal={toggleModal}
          handleCloseModal={handleCloseModal}
        />
      )}
    </>
  );
};
