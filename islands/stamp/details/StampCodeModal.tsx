import { useEffect, useState } from "preact/hooks";
import { StampRow } from "globals";
import { useFeePolling } from "$client/hooks/useFeePolling.ts";
import StampImage from "./StampImage.tsx";

interface StampCodeModalProps {
  src: string;
  toggleModal: () => void;
  handleCloseModal: () => void;
}

const StampCodeModal = (
  { src, toggleModal, handleCloseModal }: StampCodeModalProps,
) => {
  const [formattedSrc, setFormattedSrc] = useState("");

  useEffect(() => {
    setFormattedSrc(formatHtmlSource(src));
  }, [src]);

  function formatHtmlSource(html: string): string {
    let formatted = html.replace(/</g, "\n<").replace(/>/g, ">\n");
    let indent = 0;
    let result = "";

    formatted.split("\n").forEach((line) => {
      line = line.trim();
      if (line.match(/^<\//) && indent > 0) {
        indent -= 2;
      }
      result += " ".repeat(indent) + line + "\n";
      if (line.match(/^<[^/]/) && !line.match(/\/>/)) {
        indent += 2;
      }
    });

    return result.trim();
  }

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-4/5 h-auto">
        <div class="relative bg-white rounded-lg shadow overflow-hidden">
          <div class="flex flex-col gap-4 items-center justify-between p-4 md:p-5 rounded-t">
            <button
              onClick={toggleModal}
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
            <pre class="text-sm text-gray-800 whitespace-pre-wrap break-words">
              <code>{src}</code>
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampCodeModal;
