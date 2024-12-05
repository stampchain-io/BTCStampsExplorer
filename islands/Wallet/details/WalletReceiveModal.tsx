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

  const tooltip =
    "absolute left-1/2 -translate-x-1/2 bottom-full text-stamp-grey-light text-xs mb-1 hidden group-hover:block whitespace-nowrap";

  return (
    <ModalLayout onClose={onClose} title="RECEIVE">
      <div class="flex flex-col -mt-3 mobileLg:-mt-4 items-center">
        {qrCodeDataUrl && (
          <img
            src={qrCodeDataUrl}
            alt="QR Code"
            class="w-60 h-60 mobileLg:w-72 mobileLg:h-72"
          />
        )}
        <p class="break-all text-center text-base mobileLg:text-xl leading-relaxed text-stamp-grey-light max-w-full pt-5 mobileLg:pt-7">
          {formatAddress(address)}
        </p>
      </div>
      <div class="flex flex-col items-center pt-3 mobileLg:pt-6">
        <div class="relative group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            class="w-6 h-6 mobileLg:w-[30px] mobileLg:h-[30px] fill-stamp-purple hover:fill-stamp-purple-highlight cursor-pointer"
            viewBox="0 0 32 32"
            role="button"
            aria-label="Copy"
          >
            <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
          </svg>
          <div class={tooltip}>
            COPY
          </div>
        </div>
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
        class="text-stamp-purple text-base mobileLg:text-xl"
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
