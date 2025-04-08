/* ===== PREVIEW IMAGE MODAL COMPONENT ===== */
import { useEffect } from "preact/hooks";
import { handleImageError } from "$lib/utils/imageUtils.ts";
import TextContentIsland from "$islands/stamp/detail/StampTextContent.tsx";
import { modalBgCenter } from "$layout";

/* ===== TYPES ===== */
interface PreviewImageModalProps {
  src: string | File;
  handleCloseModal: () => void;
  contentType?: "html" | "text" | "image";
}

/* ===== COMPONENT ===== */
const PreviewImageModal = ({
  src,
  handleCloseModal,
  contentType = "image",
}: PreviewImageModalProps) => {
  /* ===== COMPUTED VALUES ===== */
  const imageUrl = typeof src === "string" ? src : URL.createObjectURL(src);

  /* ===== EFFECTS ===== */
  // Effect for keyboard shortcut handling
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

  // Effect for preventing body scroll while modal is open
  useEffect(() => {
    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";

    return () => {
      document.documentElement.style.overflow = "";
      document.body.style.overflow = "";
    };
  }, []);

  // Cleanup for file object URLs
  if (src instanceof File) {
    globalThis.addEventListener("unload", () => {
      URL.revokeObjectURL(imageUrl);
    });
  }

  /* ===== RENDER ===== */
  return (
    <div
      class={modalBgCenter}
      onClick={handleCloseModal}
    >
      <div
        class="relative min-h-0 min-w-0"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="h-[min(calc(100vh-48px),calc(100vw-48px))] w-[min(calc(100vh-48px),calc(100vw-48px))] mobileLg:h-[min(calc(100vh-96px),calc(100vw-96px))] mobileLg:w-[min(calc(100vh-96px),calc(100vw-96px))]">
          <div class="flex flex-col h-full w-full stamp-container">
            {/* ===== CONTENT RENDERING ===== */}
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
                    imageRendering: "pixelated",
                  }}
                  src={imageUrl}
                  onError={handleImageError}
                  alt="Stamp Preview"
                />
              )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PreviewImageModal;
