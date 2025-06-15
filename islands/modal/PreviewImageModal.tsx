/* ===== PREVIEW IMAGE MODAL COMPONENT ===== */
import { handleImageError } from "$lib/utils/imageUtils.ts";
import { StampTextContent } from "$content";
import { ModalBase } from "../../components/layout/ModalBase.tsx";
import { closeModal } from "$islands/modal/states.ts";
import { logger } from "$lib/utils/logger.ts";

/* ===== TYPES ===== */
interface PreviewImageModalProps {
  src: string | File;
  contentType?: "html" | "text" | "image";
}

/* ===== COMPONENT ===== */
const PreviewImageModal = ({
  src,
  contentType = "image",
}: PreviewImageModalProps) => {
  /* ===== COMPUTED VALUES ===== */
  const imageUrl = typeof src === "string" ? src : URL.createObjectURL(src);

  // Cleanup for file object URLs
  if (src instanceof File) {
    globalThis.addEventListener("unload", () => {
      URL.revokeObjectURL(imageUrl);
    });
  }

  /* ===== RENDER ===== */
  return (
    <ModalBase
      onClose={() => {
        logger.debug("ui", {
          message: "Preview image modal closing",
          component: "PreviewImageModal",
        });
        closeModal();
      }}
      title=""
      hideHeader
      className="!w-[min(calc(100vh-48px),calc(100vw-48px))] !h-[min(calc(100vh-48px),calc(100vw-48px))] mobileLg:!w-[min(calc(100vh-96px),calc(100vw-96px))] mobileLg:!h-[min(calc(100vh-96px),calc(100vw-96px))] !p-3 min-[420px]:!p-6"
    >
      <div class="flex flex-col h-full w-full stamp-container">
        {/* ===== CONTENT RENDERING ===== */}
        {contentType === "html"
          ? (
            <iframe
              width="100%"
              height="100%"
              scrolling="no"
              className="rounded-sm mobileMd:rounded-md w-full h-full"
              sandbox="allow-scripts allow-same-origin"
              src={imageUrl}
              loading="lazy"
              title="Stamp Preview"
            />
          )
          : contentType === "text"
          ? (
            <div className="w-full h-full rounded-sm mobileMd:rounded-md aspect-square">
              <StampTextContent src={imageUrl} />
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
    </ModalBase>
  );
};

export default PreviewImageModal;
