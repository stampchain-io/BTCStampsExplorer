import { useEffect, useState } from "preact/hooks";

import { StampRow } from "globals";
import { mimeTypesArray } from "utils/util.ts";

import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";
import StampCodeModal from "$islands/stamp/details/StampCodeModal.tsx";
import StampImageFullScreen from "$islands/stamp/details/StampImageFullScreen.tsx";

const RightPanel = (
  { toggleCodeModal, toggleFullScreenModal, showCodeButton }: {
    toggleCodeModal: () => void;
    toggleFullScreenModal: () => void;
    showCodeButton: boolean;
  },
) => {
  return (
    <div className={"flex justify-between p-5 bg-[#1F002E]"}>
      <div className={"flex gap-4"}>
        <a href="#">
          <img src="/img/stamp/Copy.png" />
        </a>
        <a href="#">
          <img src="/img/stamp/InstagramLogo.png" />
        </a>
        <a href="#">
          <img src="/img/stamp/XLogo.png" />
        </a>
      </div>
      <div className={"flex gap-4"}>
        {showCodeButton && (
          <img
            src="/img/stamp/Code.png"
            className="cursor-pointer"
            onClick={toggleCodeModal}
          />
        )}
        <img
          src="/img/stamp/CornersOut.png"
          className="cursor-pointer"
          onClick={toggleFullScreenModal}
        />
      </div>
    </div>
  );
};

export const StampImage = (
  { stamp, className, flag }: {
    stamp: StampRow;
    className?: string;
    flag?: boolean;
  },
) => {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const handleCloseCodeModal = () => {
    setIsCodeModalOpen(false);
  };
  const toggleCodeModal = () => {
    setIsCodeModalOpen(!isCodeModalOpen);
  };

  const [isFullScreenModalOpen, setIsFullScreenModalOpen] = useState(false);
  const handleCloseFullScreenModal = () => {
    setIsFullScreenModalOpen(false);
  };
  const toggleFullScreenModal = () => {
    setIsFullScreenModalOpen(!isCodeModalOpen);
  };

  const getStampSrc = () => {
    if (!stamp.stamp_url) return "/content/not-available.png";

    const urlParts = stamp.stamp_url.split("/");
    const filenameParts = urlParts[urlParts.length - 1].split(".");
    const txHash = filenameParts[0];
    const suffix = filenameParts[1];

    if (!mimeTypesArray.includes(stamp.stamp_mimetype || "")) {
      return "/content/not-available.png";
    }

    return `/content/${txHash}.${suffix}`;
  };

  const [htmlContent, setHtmlContent] = useState<string | null>(null);
  useEffect(() => {
    if (stamp.stamp_mimetype === "text/html") {
      fetchHtmlContent();
    }
  }, [stamp]);
  const fetchHtmlContent = async () => {
    try {
      const response = await fetch(src);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const content = await response.text();
      setHtmlContent(content);
    } catch (error) {
      console.error("Failed to fetch HTML content:", error);
      setHtmlContent(null);
    }
  };

  const src = getStampSrc();

  return (
    <>
      {src === "/content/not-available.png" && (
        <div className="stamp-container">
          <img
            width="100%"
            loading="lazy"
            className={`max-w-none object-contain rounded-lg ${className} pixelart stamp-image`}
            src={src}
            alt="Not Available"
          />
        </div>
      )}

      {(src !== "/content/not-available.png" &&
        stamp.stamp_mimetype === "text/html") &&
        (
          <div
            className={`${className} flex flex-col gap-4`}
          >
            <div
              className={"p-6 bg-[#1F002E] flex justify-center items-center"}
            >
              <iframe
                width="100%"
                height="100%"
                scrolling="no"
                className={`${className} aspect-square rounded-lg`}
                sandbox="allow-scripts allow-same-origin"
                src={src}
                loading="lazy"
                onError={(e) => {
                  e.currentTarget.src = stamp.stamp_url;
                }}
                title="Stamp"
              />
            </div>
            {flag && (
              <RightPanel
                toggleCodeModal={toggleCodeModal}
                toggleFullScreenModal={toggleFullScreenModal}
                showCodeButton={true}
              />
            )}
          </div>
        )}

      {(src !== "/content/not-available.png" &&
        stamp.stamp_mimetype === "text/plain") && (
        <TextContentIsland src={src} />
      )}

      {src !== "/content/not-available.png" &&
        stamp.stamp_mimetype !== "text/html" &&
        stamp.stamp_mimetype !== "text/plain" && (
        <div
          className={`${className} flex flex-col gap-4`}
        >
          <div className={"p-6 bg-[#1F002E] justify-center items-center"}>
            <div className="stamp-container ">
              <img
                width="100%"
                loading="lazy"
                className={`max-w-none object-contain rounded-lg pixelart stamp-image`}
                src={src}
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    "/content/not-available.png";
                }}
                alt="Stamp"
              />
            </div>
          </div>
          {flag && (
            <RightPanel
              toggleCodeModal={toggleCodeModal}
              toggleFullScreenModal={toggleFullScreenModal}
              showCodeButton={false}
            />
          )}
        </div>
      )}

      {isCodeModalOpen && (
        <StampCodeModal
          src={htmlContent || ""}
          toggleModal={() => setIsCodeModalOpen(false)}
          handleCloseModal={handleCloseCodeModal}
        />
      )}

      {isFullScreenModalOpen && (
        <StampImageFullScreen
          src={src}
          toggleModal={() => setIsFullScreenModalOpen(false)}
          handleCloseModal={handleCloseFullScreenModal}
          typeFlag={(src !== "/content/not-available.png" &&
              stamp.stamp_mimetype === "text/html")
            ? 1
            : ((src !== "/content/not-available.png" &&
                stamp.stamp_mimetype !== "text/html" &&
                stamp.stamp_mimetype !== "text/plain")
              ? 2
              : 0)}
        />
      )}
    </>
  );
};

export default StampImage;
