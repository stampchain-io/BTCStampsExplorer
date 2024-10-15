import { ComponentChildren } from "preact";
import { useEffect, useState } from "preact/hooks";
import QRCode from "qrcode";

interface Props {
  onClose: () => void;
  address: string;
}

function WalletReceiveModal({ onClose, address }: Props) {
  const handleModalClick = (e: MouseEvent) => {
    e.stopPropagation();
  };

  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>("");

  useEffect(() => {
    const bitcoinUri = `bitcoin:${address}`;
    QRCode.toDataURL(bitcoinUri)
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: Error) => console.error(err));
  }, [address]);

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={onClose}
    >
      <div class="relative w-full max-w-[360px]">
        <div
          class="relative bg-[#0B0B0B] rounded-lg shadow overflow-hidden"
          onClick={handleModalClick}
        >
          <div class="space-y-4 p-4">
            <CloseButton onClick={onClose} />
            <ModalTitle>RECEIVE</ModalTitle>
            {qrCodeDataUrl && (
              <img src={qrCodeDataUrl} alt="QR Code" class="mx-auto" />
            )}
            <p class="break-words text-center text-[#999999]">
              {formatAddress(address)}
            </p>
            <img
              src="/img/wallet/icon-edit.svg"
              alt="Edit"
              class="mx-auto cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <img
      onClick={onClick}
      class="w-6 h-6 ms-auto cursor-pointer"
      alt="Close modal"
      src="/img/wallet/icon-close.svg"
    />
  );
}

function ModalTitle({ children }: { children: ComponentChildren }) {
  return (
    <p class="font-black text-5xl text-center bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC]">
      {children}
    </p>
  );
}

function formatAddress(address: string): string {
  return address.match(/.{1,4}/g)?.join(" ") ?? address;
}

export default WalletReceiveModal;
