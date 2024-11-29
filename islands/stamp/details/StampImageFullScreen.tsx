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

  return (
    <div
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#0b0b0b] bg-opacity-95 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative w-full max-w-[800px] max-h-[800px] p-6 mobileLg:p-12">
        <div class="relative flex flex-col p-3 mobileMd:p-6 dark-gradient rounded-md overflow-hidden">
          {contentType === "html"
            ? (
              <iframe
                width="100%"
                height="100%"
                scrolling="no"
                className="aspect-square rounded-sm"
                sandbox="allow-scripts allow-same-origin"
                src={imageUrl}
                loading="lazy"
                title="Stamp Preview"
              />
            )
            : (
              <img
                className="max-w-full rounded-sm pixelart stamp-image aspect-square"
                style={{
                  objectFit: "contain",
                  imageRendering: "pixelated",
                  backgroundColor: "rgba(0,0,0,0.2)",
                }}
                src={imageUrl}
                onError={handleImageError}
                alt="Preview"
              />
            )}
        </div>
      </div>
    </div>
  );
};

export default StampImageFullScreen;
