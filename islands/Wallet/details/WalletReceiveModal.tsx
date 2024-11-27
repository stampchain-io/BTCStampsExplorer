import { useEffect, useState } from "preact/hooks";
import QRCode from "qrcode";
import { ModalLayout } from "$components/shared/modal/ModalLayout.tsx";

interface Props {
  onClose: () => void;
  address: string;
}

function WalletReceiveModal({ onClose, address }: Props) {
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
    <ModalLayout onClose={onClose} title="RECEIVE">
      <div class="flex flex-col gap-6 items-center">
        {qrCodeDataUrl && (
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            class="w-36 h-36 mobileLg:w-48 mobileLg:h-48"
          />
        )}
        <p class="break-all text-center text-base mobileLg:text-xl leading-relaxed text-stamp-grey-light max-w-full pt-3">
          {formatAddress(address)}
        </p>
        <img
          src="/img/wallet/icon-copy.svg"
          alt="Copy Bitcoin address"
          class="cursor-pointer fill-stamp-grey"
        />
      </div>
    </ModalLayout>
  );
}

function formatAddress(address: string): JSX.Element[] {
  const groups = address.match(/.{1,4}/g) ?? [address];
  return groups.map((group, index) => [
    index % 2 === 0 ? <span key={index}>{group}</span> : (
      <span
        key={index}
        class="font-bold text-stamp-grey text-base mobileLg:text-xl"
      >
        {group}
      </span>
    ),
    // Add line break after every 4th group (16 characters)
    index < groups.length - 1 && (
      (index + 1) % 4 === 0
        ? <br key={`break-${index}`} />
        : <span key={`space-${index}`}>&nbsp;</span>
    ),
  ]).flat();
}

export default WalletReceiveModal;
