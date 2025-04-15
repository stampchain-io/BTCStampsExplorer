import { useState } from "preact/hooks";
import { Button } from "$components/button/ButtonBase.tsx";
import BuyStampModal from "$islands/modal/BuyStampModal.tsx";
import { ConnectWalletModal } from "$islands/modal/ConnectWalletModal.tsx";
import DonateStampModal from "$islands/modal/DonateStampModal.tsx";
import PreviewCodeModal from "$islands/modal/PreviewCodeModal.tsx";
import PreviewImageModal from "$islands/modal/PreviewImageModal.tsx";
import RecieveAddyModal from "$islands/modal/RecieveAddyModal.tsx";
import SendBTCModal from "$islands/modal/SendBTCModal.tsx";
import SendStampModal from "$islands/modal/SendStampModalWIP.tsx";

export default function ModalTestContent() {
  // State for controlling modal visibility
  const [activeModal, setActiveModal] = useState<string | null>(null);

  // Mock data for modals
  const mockStamp = {
    stamp: 1,
    cpid: "mock-cpid",
    unbound_quantity: 10,
  };

  const mockStamps = {
    data: [mockStamp],
    pagination: {
      page: 1,
      limit: 10,
      total: 1,
      totalPages: 1,
    },
  };

  // Toggle modal helper
  const toggleModal = (modalName: string) => {
    setActiveModal(activeModal === modalName ? null : modalName);
  };

  // Close modal helper
  const handleCloseModal = () => {
    setActiveModal(null);
  };

  return (
    <div class="flex flex-col gap-6 w-full max-w-md">
      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("buy")}
      >
        BUY STAMP MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("connect")}
      >
        CONNECT WALLET MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("donate")}
      >
        DONATE STAMP MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("previewCode")}
      >
        PREVIEW CODE MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("previewImage")}
      >
        PREVIEW IMAGE MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("receiveAddy")}
      >
        PREVIEW ADDY MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("sendBTC")}
      >
        SEND BTC MODAL
      </Button>

      <Button
        variant="outline"
        color="purple"
        size="lg"
        onClick={() => toggleModal("sendStamp")}
      >
        SEND STAMP MODAL
      </Button>

      {/* Modals */}
      {activeModal === "buy" && (
        <BuyStampModal
          stamp={mockStamp}
          fee={1}
          handleChangeFee={() => {}}
          toggleModal={() => toggleModal("buy")}
          handleCloseModal={handleCloseModal}
          dispenser={{}}
        />
      )}

      {activeModal === "connect" && (
        <ConnectWalletModal
          connectors={[]}
          toggleModal={() => toggleModal("connect")}
          handleCloseModal={handleCloseModal}
        />
      )}

      {activeModal === "donate" && (
        <DonateStampModal
          stamp={mockStamp}
          fee={1}
          handleChangeFee={() => {}}
          toggleModal={() => toggleModal("donate")}
          handleCloseModal={handleCloseModal}
          dispenser={{}}
        />
      )}

      {activeModal === "previewCode" && (
        <PreviewCodeModal
          src="console.log('Hello World')"
          toggleModal={() => toggleModal("previewCode")}
          handleCloseModal={handleCloseModal}
        />
      )}

      {activeModal === "previewImage" && (
        <PreviewImageModal
          src="/img/stamping/image-upload.svg"
          handleCloseModal={handleCloseModal}
        />
      )}

      {activeModal === "receiveAddy" && (
        <RecieveAddyModal
          onClose={handleCloseModal}
          address="bc1qxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        />
      )}

      {activeModal === "sendBTC" && (
        <SendBTCModal
          fee={1}
          balance={100000}
          handleChangeFee={() => {}}
          onClose={handleCloseModal}
        />
      )}

      {activeModal === "sendStamp" && (
        <SendStampModal
          fee={1}
          handleChangeFee={() => {}}
          toggleModal={() => toggleModal("sendStamp")}
          handleCloseModal={handleCloseModal}
          stamps={mockStamps}
        />
      )}
    </div>
  );
}
