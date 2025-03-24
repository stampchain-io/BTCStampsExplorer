import { useEffect, useState } from "preact/hooks";
import { formatHtmlFromUrl } from "$client/utils/format.ts";
import { StampDetailStyles } from "$islands/stamp/styles.ts";

interface StampCodeModalProps {
  src: string;
  toggleModal: () => void;
  handleCloseModal: () => void;
}

export default function StampCodeModal(
  { src, handleCloseModal }: StampCodeModalProps,
) {
  const [formattedSrc, setFormattedSrc] = useState("");

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    setFormattedSrc(formatHtmlFromUrl(src));
    // setFormattedSrc(formatHtmlSource(src));
  }, [src]);

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleCloseModal();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [handleCloseModal]);

  return (
    <div
      class={StampDetailStyles.modalBgCenter}
      onClick={handleCloseModal}
    >
      <div
        class="relative w-[calc(100vw-48px)] h-[calc(100vh-48px)] mobileLg:w-[calc(100vw-96px)] mobileLg:h-[calc(100vh-96px)] max-w-full mobileLg:max-w-[800px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex flex-col p-6 mobileMd:p-9 rounded-md bg-[#FAFAFA] w-full h-full">
          {
            /* <div class="relative top-0 right-0 -mr-3 mobileLg:-mr-2 -mt-1.5 mobileMd:-mt-3 mobileLg:-mt-2 w-6 h-6 ms-auto cursor-pointer">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="18"
              height="18"
              viewBox="0 0 32 32"
              class="cursor-pointer w-[18px] h-[18px] mobileLg:w-6 mobileLg:h-6 hover:fill-stamp-grey-darker"
              onClick={toggleModal}
              role="button"
              aria-label="Close Modal"
              fill="#999999"
            >
              <path d="M26.0612 23.9387C26.343 24.2205 26.5013 24.6027 26.5013 25.0012C26.5013 25.3997 26.343 25.7819 26.0612 26.0637C25.7794 26.3455 25.3972 26.5038 24.9987 26.5038C24.6002 26.5038 24.218 26.3455 23.9362 26.0637L15.9999 18.125L8.0612 26.0612C7.7794 26.343 7.39721 26.5013 6.9987 26.5013C6.60018 26.5013 6.21799 26.343 5.9362 26.0612C5.6544 25.7794 5.49609 25.3972 5.49609 24.9987C5.49609 24.6002 5.6544 24.218 5.9362 23.9362L13.8749 16L5.9387 8.06122C5.6569 7.77943 5.49859 7.39724 5.49859 6.99872C5.49859 6.60021 5.6569 6.21802 5.9387 5.93622C6.22049 5.65443 6.60268 5.49612 7.0012 5.49612C7.39971 5.49612 7.7819 5.65443 8.0637 5.93622L15.9999 13.875L23.9387 5.93497C24.2205 5.65318 24.6027 5.49487 25.0012 5.49487C25.3997 5.49487 25.7819 5.65318 26.0637 5.93497C26.3455 6.21677 26.5038 6.59896 26.5038 6.99747C26.5038 7.39599 26.3455 7.77818 26.0637 8.05998L18.1249 16L26.0612 23.9387Z" />
            </svg>
          </div> */
          }
          <div class="flex flex-col text-xs mobileLg:text-sm text-stamp-grey-darkest leading-tight overflow-auto scrollbar-grey">
            <code class="whitespace-pre-wrap">{formattedSrc}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
