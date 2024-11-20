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
      class="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-[#181818] bg-opacity-50 backdrop-filter backdrop-blur-sm"
      onClick={handleCloseModal}
    >
      <div class="relative p-4 w-full max-w-[800px] h-auto">
        <div class="relative bg-white rounded-lg shadow overflow-hidden">
          <div class="flex flex-col gap-4 items-center justify-between p-4 tablet:p-5 rounded-t">
            {contentType === "html"
              ? (
                <iframe
                  width="100%"
                  height="100%"
                  scrolling="no"
                  className="aspect-square rounded-lg"
                  sandbox="allow-scripts allow-same-origin"
                  src={imageUrl}
                  loading="lazy"
                  title="Stamp Preview"
                />
              )
              : (
                <img
                  className="w-[300px] tablet:w-[640px] max-w-none object-contain rounded-lg pixelart stamp-image"
                  style={{
                    height: "100%",
                    objectFit: "contain",
                    imageRendering: "pixelated",
                    backgroundColor: "rgb(0,0,0)",
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
