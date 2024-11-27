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
    QRCode.toDataURL(bitcoinUri, {
      width: 256,
      margin: 2,
      color: {
        dark: "#cccccc",
        light: "#00000000",
      },
    })
      .then((url: string) => setQrCodeDataUrl(url))
      .catch((err: Error) => console.error(err));
  }, [address]);

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center bg-[#100019] bg-opacity-75 backdrop-filter backdrop-blur-sm"
      onClick={onClose}
    >
      <div class="relative w-[360px] h-[600px] p-3 mobileMd:p-6 bg-[#080808] rounded-lg shadow overflow-hidden">
        <div
          class="relative"
          onClick={handleModalClick}
        >
          <div class="space-y-4 p-4">
            <CloseButton onClick={onClose} />
            <ModalTitle>RECEIVE</ModalTitle>
            {qrCodeDataUrl && (
              <div class="flex justify-center items-center">
                <img
                  src={qrCodeDataUrl}
                  alt="QR Code"
                  class="w-48 h-48"
                />
              </div>
            )}
            <p class="text-base break-words text-center text-stamp-grey-light">
              {formatAddress(address)}
            </p>
            <img
              src="/img/wallet/icon-copy.svg"
              alt="Copy Bitcoin address"
              class="mx-auto cursor-pointer fill-stamp-grey"
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
    <p class="font-black text-4xl text-center purple-gradient3">
      {children}
    </p>
  );
}

function formatAddress(address: string): JSX.Element[] {
  const groups = address.match(/.{1,4}/g) ?? [address];
  return groups.map((group, index) => [
    index % 2 === 0
      ? <span key={index}>{group}</span>
      : <span key={index} class="font-bold text-stamp-grey">{group}</span>,
    index < groups.length - 1 && <span key={`space-${index}`}>&nbsp;</span>,
  ]).flat();
}

export default WalletReceiveModal;
