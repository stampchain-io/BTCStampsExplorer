import { useEffect, useState } from "preact/hooks";

interface StampCodeModalProps {
  src: string;
  toggleModal: () => void;
  handleCloseModal: () => void;
}

export default function StampCodeModal(
  { src, toggleModal, handleCloseModal }: StampCodeModalProps,
) {
  const [formattedSrc, setFormattedSrc] = useState("");

  useEffect(() => {
    setFormattedSrc(formatHtmlSource(src));
  }, [src]);

  function formatHtmlSource(html: string): string {
    const formatted = html.replace(/</g, "\n<").replace(/>/g, ">\n");
    let indent = 0;
    let result = "";

    formatted.split("\n").forEach((line) => {
      line = line.trim();
      if (line.match(/^<\//) && indent > 0) {
        indent -= 3; // Decrease indent for closing tags
      }
      if (line) {
        result += " ".repeat(indent) + line + "\n"; // Add line with current indent
      }
      if (line.match(/^<[^/]/) && !line.match(/\/>/)) {
        indent += 2; // Increase indent for opening tags
      }
    });

    return result.trim();
  }
  const modalBgBlur =
    "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#000000] bg-opacity-70 backdrop-filter backdrop-blur-md";

  return (
    <div
      class={modalBgBlur}
      onClick={handleCloseModal}
    >
      <div
        class="relative w-[calc(100vw-48px)] max-w-[800px] h-[calc(100vh-48px)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex flex-col p-6 mobileMd:p-9 rounded-md bg-[#FAFAFA] h-full overflow-hidden">
          <div class="relative top-0 right-0 -mr-3 mobileLg:-mr-2 -mt-1.5 mobileMd:-mt-3 mobileLg:-mt-2 w-6 h-6 ms-auto cursor-pointer">
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
          </div>
          <div class="flex flex-col max-w-full h-full text-xs text-stamp-grey-darkest leading-tight overflow-y-auto overflow-x-auto scrollbar-grey">
            <code class="whitespace-pre-wrap">{formattedSrc}</code>
          </div>
        </div>
      </div>
    </div>
  );
}
