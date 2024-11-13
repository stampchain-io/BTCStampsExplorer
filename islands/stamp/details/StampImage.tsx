import { useEffect, useRef, useState } from "preact/hooks";

import { StampRow } from "globals";
import { mimeTypesArray } from "$lib/utils/util.ts";

import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";
import StampCodeModal from "$islands/stamp/details/StampCodeModal.tsx";
import StampImageFullScreen from "$islands/stamp/details/StampImageFullScreen.tsx";

function RightPanel(
  { stamp, toggleCodeModal, toggleFullScreenModal, showCodeButton }: {
    stamp: StampRow;
    toggleCodeModal: () => void;
    toggleFullScreenModal: () => void;
    showCodeButton: boolean;
  },
) {
  const url = `https://stampchain.io/stamp/${stamp.stamp}`;
  const text = "Check out what I found @Stampchain";

  const shareContent = async () => {
    const shareData = {
      title: text,
      text: text,
      url: url,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert("Sharing is not supported in your browser.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const shareToX = () => {
    const xShareUrl = `https://x.com/intent/post?text=${
      encodeURIComponent(text)
    }&url=${encodeURIComponent(url)}`;
    globalThis.open(xShareUrl, "_blank", "noopener,noreferrer");
  };

  const copyLink = () => {
    navigator.clipboard.writeText(url).then(() => {
      alert("Link copied to clipboard!");
    }).catch((error) => {
      console.error("Error copying to clipboard:", error);
    });
  };

  return (
    <div className="flex justify-between p-5 bg-[#1F002E]">
      <div className="flex gap-4">
        <img
          src="/img/stamp/Copy.png"
          alt="Copy Link"
          className="cursor-pointer"
          onClick={copyLink}
        />
        <img
          src="/img/stamp/InstagramLogo.png"
          alt="Share to Instagram"
          className="cursor-pointer"
          onClick={shareContent}
        />
        <img
          src="/img/stamp/XLogo.png"
          alt="Share to X"
          className="cursor-pointer"
          onClick={shareToX}
        />
      </div>
      <div className="flex gap-4">
        {showCodeButton && (
          <img
            src="/img/stamp/Code.png"
            className="cursor-pointer"
            onClick={toggleCodeModal}
            alt="View Code"
          />
        )}
        <img
          src="/img/stamp/CornersOut.png"
          className="cursor-pointer"
          onClick={toggleFullScreenModal}
          alt="Full Screen"
        />
      </div>
    </div>
  );
}

export function StampImage(
  { stamp, className, flag }: {
    stamp: StampRow;
    className?: string;
    flag?: boolean;
  },
) {
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const imgScopeRef = useRef(null);
  const [transform, setTransform] = useState("");

  const updateTransform = () => {
    if (!imgScopeRef.current) return;
    const width = imgScopeRef.current.clientWidth;
    console.log("counting====>", (width + 50) / 648);

    setTransform(
      `scale(${(width + 50) / 648}))`,
    );
  };

  useEffect(() => {
    // Set initial transform
    updateTransform();

    // Add event listener to handle window resize
    globalThis.addEventListener("resize", updateTransform);

    // Cleanup event listener on component unmount
    return () => {
      globalThis.removeEventListener("resize", updateTransform);
    };
  }, []);

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
    setIsFullScreenModalOpen(!isFullScreenModalOpen);
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
  const src = getStampSrc();

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

      {src !== "/content/not-available.png" &&
        stamp.stamp_mimetype === "text/html" && (
        <div className={`${className} flex flex-col gap-4`}>
          <div
            className="p-6 bg-[#1F002E] flex justify-center items-center relative w-full h-full pt-[56.25%]"
            ref={imgScopeRef}
          >
            <iframe
              width="100%"
              height="100%"
              scrolling="no"
              className={`${className} aspect-square rounded-lg absolute top-0 left-0`}
              sandbox="allow-scripts allow-same-origin"
              src={src}
              loading="lazy"
              style={{ transform }}
              onError={(e) => {
                e.currentTarget.src = stamp.stamp_url;
              }}
              title="Stamp"
            />
          </div>
          {flag && (
            <RightPanel
              stamp={stamp}
              toggleCodeModal={toggleCodeModal}
              toggleFullScreenModal={toggleFullScreenModal}
              showCodeButton={true}
            />
          )}
        </div>
      )}

      {src !== "/content/not-available.png" &&
        stamp.stamp_mimetype === "text/plain" && (
        <TextContentIsland
          src={src}
        />
      )}

      {src !== "/content/not-available.png" &&
        stamp.stamp_mimetype !== "text/html" &&
        stamp.stamp_mimetype !== "text/plain" && (
        <div className="flex flex-col gap-4">
          <div className={`${className} p-6 bg-[#1F002E]`}>
            <div className="stamp-container">
              <img
                width="100%"
                loading="lazy"
                className="max-w-none object-contain rounded-lg pixelart stamp-image"
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
              stamp={stamp}
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
          toggleModal={handleCloseCodeModal}
          handleCloseModal={handleCloseCodeModal}
        />
      )}

      {isFullScreenModalOpen && (
        <StampImageFullScreen
          src={src}
          toggleModal={handleCloseFullScreenModal}
          handleCloseModal={handleCloseFullScreenModal}
          typeFlag={src !== "/content/not-available.png" &&
              stamp.stamp_mimetype === "text/html"
            ? 1
            : src !== "/content/not-available.png" &&
                stamp.stamp_mimetype !== "text/html" &&
                stamp.stamp_mimetype !== "text/plain"
            ? 2
            : 0}
        />
      )}
    </>
  );
}

export default StampImage;
