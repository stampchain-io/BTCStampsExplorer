import { useEffect } from "preact/hooks";
import { handleImageError } from "$lib/utils/imageUtils.ts";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";

interface StampImageFullScreenProps {
  src: string | File;
  handleCloseModal: () => void;
  contentType?: "html" | "text" | "image";
}

const StampImageFullScreen = ({
  src,
  handleCloseModal,
  contentType = "image",
}: StampImageFullScreenProps) => {
  const imageUrl = typeof src === "string" ? src : URL.createObjectURL(src);

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

  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  if (src instanceof File) {
    globalThis.addEventListener("unload", () => {
      URL.revokeObjectURL(imageUrl);
    });
  }

  const modalBgCenter =
    "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#000000] bg-opacity-70 backdrop-filter backdrop-blur-md";

  return (
    <div
      class={modalBgCenter}
      onClick={handleCloseModal}
    >
      <div
        class="relative min-h-0 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="h-[min(calc(100vh-48px),calc(100vw-48px))] w-[min(calc(100vh-48px),calc(100vw-48px))] mobileLg:h-[min(calc(100vh-96px),calc(100vw-96px))] mobileLg:w-[min(calc(100vh-96px),calc(100vw-96px))] aspect-square">
          <div class="flex flex-col p-3 mobileMd:p-6 dark-gradient-modal rounded-lg">
            <div class="flex flex-col h-full w-full">
              {contentType === "html"
                ? (
                  <iframe
                    width="100%"
                    height="100%"
                    scrolling="no"
                    className="rounded-sm mobileMd:rounded-md aspect-square"
                    sandbox="allow-scripts allow-same-origin"
                    src={imageUrl}
                    loading="lazy"
                    title="Stamp Preview"
                  />
                )
                : contentType === "text"
                ? (
                  <div className="w-full h-full rounded-sm mobileMd:rounded-md aspect-square">
                    <TextContentIsland src={imageUrl} />
                  </div>
                )
                : (
                  <img
                    className="rounded-sm mobileMd:rounded-md pixelart stamp-image aspect-square"
                    style={{
                      objectFit: "contain",
                      imageRendering: "pixelated",
                    }}
                    src={imageUrl}
                    onError={handleImageError}
                    alt="Preview"
                  />
                )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StampImageFullScreen;
