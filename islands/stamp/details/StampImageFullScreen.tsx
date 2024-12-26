import { handleImageError } from "$lib/utils/imageUtils.ts";

interface StampImageFullScreenProps {
  src: string | File;
  handleCloseModal: () => void;
  contentType?: "html" | "image";
}

const StampImageFullScreen = ({
  src,
  handleCloseModal,
  contentType = "image",
}: StampImageFullScreenProps) => {
  const imageUrl = typeof src === "string" ? src : URL.createObjectURL(src);

  if (src instanceof File) {
    globalThis.addEventListener("unload", () => {
      URL.revokeObjectURL(imageUrl);
    });
  }

  const modalBgBlur =
    "fixed inset-0 z-50 flex items-center justify-center overflow-hidden bg-[#000000] bg-opacity-70 backdrop-filter backdrop-blur-md";

  return (
    <div
      class={modalBgBlur}
      onClick={handleCloseModal}
    >
      <div
        class="relative w-[calc(100vw-48px)] max-w-[800px] h-[calc(100vh-48px)] max-h-[800px]"
        onClick={(e) => e.stopPropagation()}
      >
        <div class="flex flex-col p-3 mobileMd:p-6 dark-gradient-modal rounded-lg overflow-hidden">
          <div class="flex flex-col stamp-container">
            {contentType === "html"
              ? (
                <iframe
                  width="100%"
                  height="100%"
                  scrolling="no"
                  className="aspect-square rounded-md"
                  sandbox="allow-scripts allow-same-origin"
                  src={imageUrl}
                  loading="lazy"
                  title="Stamp Preview"
                />
              )
              : (
                <img
                  className="max-w-full rounded-md pixelart stamp-image aspect-square"
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
  );
};

export default StampImageFullScreen;
