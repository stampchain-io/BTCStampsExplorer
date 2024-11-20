import { useEffect, useRef, useState } from "preact/hooks";
import { VNode } from "preact";

import { StampRow } from "globals";
import {
  getStampImageSrc,
  handleImageError,
  NOT_AVAILABLE_IMAGE,
  validateStampContent,
} from "$lib/utils/imageUtils.ts";

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
  const imgScopeRef = useRef<HTMLDivElement | null>(null);
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

  const src = getStampImageSrc(stamp);
  const isHtml = stamp.stamp_mimetype === "text/html";
  const isPlainText = stamp.stamp_mimetype === "text/plain";

  const [htmlContent, setHtmlContent] = useState<string | null>(null);

  useEffect(() => {
    if (isHtml) {
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

  const [validatedContent, setValidatedContent] = useState<VNode | null>(null);

  useEffect(() => {
    const validateContent = async () => {
      if (stamp.stamp_mimetype === "image/svg+xml") {
        const { isValid } = await validateStampContent(src);
        if (isValid) {
          setValidatedContent(
            <div className="stamp-container">
              <img
                src={src}
                loading="lazy"
                alt={`Stamp No. ${stamp.stamp}`}
                className="max-w-none object-contain rounded-lg pixelart stamp-image"
                onError={handleImageError}
              />
            </div>,
          );
        }
      }
    };

    validateContent();
  }, [src, stamp.stamp_mimetype]);

  return (
    <>
      {src === NOT_AVAILABLE_IMAGE && (
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

      {src !== NOT_AVAILABLE_IMAGE && isHtml && (
        <div className={`${className} flex flex-col gap-4`}>
          <div className="relative">
            <div className="absolute inset-0 bg-[#1F002E] z-0" />
            <div className="relative z-10 p-6 flex justify-center items-center w-full h-full pt-[56.25%]">
              <iframe
                width="100%"
                height="100%"
                scrolling="no"
                className={`${className} aspect-square rounded-lg absolute top-0 left-0`}
                sandbox="allow-scripts allow-same-origin"
                src={src}
                loading="lazy"
                style={{ transform }}
                onError={handleImageError}
                title="Stamp"
              />
            </div>
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

      {src !== NOT_AVAILABLE_IMAGE && isPlainText && (
        <TextContentIsland src={src} />
      )}

      {src !== NOT_AVAILABLE_IMAGE && !isHtml && !isPlainText && (
        <div className="flex flex-col gap-4">
          <div className="relative p-6 bg-[#1F002E]">
            <div className="stamp-container">
              <div className="relative z-10">
                {validatedContent || (
                  <img
                    width="100%"
                    loading="lazy"
                    className="max-w-none object-contain rounded-lg pixelart stamp-image"
                    src={src}
                    onError={handleImageError}
                    alt="Stamp"
                  />
                )}
              </div>
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
          typeFlag={src !== NOT_AVAILABLE_IMAGE &&
              stamp.stamp_mimetype === "text/html"
            ? 1
            : src !== NOT_AVAILABLE_IMAGE &&
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
