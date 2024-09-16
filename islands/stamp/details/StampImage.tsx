import { useEffect, useState } from "preact/hooks";

import { StampRow } from "globals";
import { mimeTypesArray } from "utils/util.ts";

import StampCodeModal from "$islands/stamp/details/StampCodeModal.tsx";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";

export const StampImage = (
  { stamp, className, flag }: {
    stamp: StampRow;
    className?: string;
    flag?: boolean;
  },
) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const handleCloseModal = (event: MouseEvent) => {
    if (event.target === event.currentTarget) {
      setIsModalOpen(false);
    }
  };

  const toggleModal = () => {
    setIsModalOpen(!isModalOpen);
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

  if (src === "/content/not-available.png") {
    return (
      <div className="stamp-container">
        <img
          width="100%"
          loading="lazy"
          className={`mx-10 md:mx-0 max-w-none object-contain rounded-lg ${className} pixelart stamp-image`}
          src={src}
          alt="Not Available"
        />
      </div>
    );
  }

  if (stamp.stamp_mimetype === "text/html") {
    return (
      <>
        <div
          className={`${className} flex flex-col gap-4`}
        >
          <div className={"p-6 bg-[#1F002E]"}>
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
                <img
                  src="/img/stamp/Code.png"
                  className="cursor-pointer"
                  onClick={toggleModal}
                />
                <a href="#">
                  <img src="/img/stamp/CornersOut.png" />
                </a>
              </div>
            </div>
          )}
        </div>
        {isModalOpen && (
          <StampCodeModal
            src={htmlContent}
            toggleModal={() => setIsModalOpen(false)}
            handleCloseModal={handleCloseModal}
          />
        )}
      </>
    );
  }

  if (stamp.stamp_mimetype === "text/plain") {
    return <TextContentIsland src={src} />;
  }

  return (
    <div
      className={`${className} flex flex-col gap-4`}
    >
      <div className={"p-6 bg-[#1F002E]"}>
        <div className="stamp-container ">
          <img
            width="100%"
            loading="lazy"
            className={`mx-10 md:mx-0 max-w-none object-contain rounded-lg pixelart stamp-image`}
            src={src}
            onError={(e) => {
              (e.target as HTMLImageElement).src = "/content/not-available.png";
            }}
            alt="Stamp"
          />
        </div>
      </div>
      {flag && (
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
            {
              /* <a href="#">
              <img src="/img/stamp/Code.png" />
            </a> */
            }
            <a href="#">
              <img src="/img/stamp/CornersOut.png" />
            </a>
          </div>
        </div>
      )}
    </div>
  );
};

export default StampImage;
