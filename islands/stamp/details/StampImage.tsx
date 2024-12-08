import { useEffect, useRef, useState } from "preact/hooks";
import { VNode } from "preact";

import { StampRow } from "globals";
import {
  getStampImageSrc,
  handleImageError,
  validateStampContent,
} from "$lib/utils/imageUtils.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";

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

  const tooltip =
    "absolute left-1/2 -translate-x-1/2 bottom-full text-stamp-grey-light text-xs mb-1 hidden group-hover:block whitespace-nowrap";

  return (
    <div className="flex justify-between p-3 mobileMd:p-6 dark-gradient">
      <div className="flex gap-3">
        <div className="relative group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="36"
            height="36"
            viewBox="0 0 36 36"
            className="cursor-pointer fill-stamp-grey-darker hover:fill-stamp-grey-light"
            onClick={copyLink}
            role="button"
            aria-label="Copy Link"
          >
            <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
          </svg>
          <div className={tooltip}>
            COPY LINK
          </div>
        </div>
        <div className="relative group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="cursor-pointer fill-stamp-grey-darker hover:fill-stamp-grey-light"
            onClick={shareContent}
            role="button"
            aria-label="Share on Instagram"
          >
            <path d="M16 10C14.8133 10 13.6533 10.3519 12.6666 11.0112C11.6799 11.6705 10.9108 12.6075 10.4567 13.7039C10.0026 14.8003 9.88378 16.0067 10.1153 17.1705C10.3468 18.3344 10.9182 19.4035 11.7574 20.2426C12.5965 21.0818 13.6656 21.6532 14.8295 21.8847C15.9933 22.1162 17.1997 21.9974 18.2961 21.5433C19.3925 21.0892 20.3295 20.3201 20.9888 19.3334C21.6481 18.3467 22 17.1867 22 16C21.9983 14.4092 21.3657 12.884 20.2408 11.7592C19.116 10.6343 17.5908 10.0017 16 10ZM16 20C15.2089 20 14.4355 19.7654 13.7777 19.3259C13.1199 18.8864 12.6072 18.2616 12.3045 17.5307C12.0017 16.7998 11.9225 15.9956 12.0769 15.2196C12.2312 14.4437 12.6122 13.731 13.1716 13.1716C13.731 12.6122 14.4437 12.2312 15.2196 12.0769C15.9956 11.9225 16.7998 12.0017 17.5307 12.3045C18.2616 12.6072 18.8864 13.1199 19.3259 13.7777C19.7654 14.4355 20 15.2089 20 16C20 17.0609 19.5786 18.0783 18.8284 18.8284C18.0783 19.5786 17.0609 20 16 20ZM22 3H10C8.14409 3.00199 6.36477 3.74012 5.05245 5.05245C3.74012 6.36477 3.00199 8.14409 3 10V22C3.00199 23.8559 3.74012 25.6352 5.05245 26.9476C6.36477 28.2599 8.14409 28.998 10 29H22C23.8559 28.998 25.6352 28.2599 26.9476 26.9476C28.2599 25.6352 28.998 23.8559 29 22V10C28.998 8.14409 28.2599 6.36477 26.9476 5.05245C25.6352 3.74012 23.8559 3.00199 22 3ZM27 22C27 23.3261 26.4732 24.5979 25.5355 25.5355C24.5979 26.4732 23.3261 27 22 27H10C8.67392 27 7.40215 26.4732 6.46447 25.5355C5.52678 24.5979 5 23.3261 5 22V10C5 8.67392 5.52678 7.40215 6.46447 6.46447C7.40215 5.52678 8.67392 5 10 5H22C23.3261 5 24.5979 5.52678 25.5355 6.46447C26.4732 7.40215 27 8.67392 27 10V22ZM24 9.5C24 9.79667 23.912 10.0867 23.7472 10.3334C23.5824 10.58 23.3481 10.7723 23.074 10.8858C22.7999 10.9994 22.4983 11.0291 22.2074 10.9712C21.9164 10.9133 21.6491 10.7704 21.4393 10.5607C21.2296 10.3509 21.0867 10.0836 21.0288 9.79264C20.9709 9.50166 21.0007 9.20006 21.1142 8.92597C21.2277 8.65189 21.42 8.41762 21.6666 8.2528C21.9133 8.08797 22.2033 8 22.5 8C22.8978 8 23.2794 8.15804 23.5607 8.43934C23.842 8.72064 24 9.10218 24 9.5Z" />
          </svg>
          <div className={tooltip}>
            SHARE ON INSTAGRAM
          </div>
        </div>
        <div className="relative group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="cursor-pointer fill-stamp-grey-darker hover:fill-stamp-grey-light"
            onClick={shareToX}
            role="button"
            aria-label="Share on X"
          >
            <path d="M26.8438 26.4638L19.0187 14.1663L26.74 5.6725C26.9146 5.47565 27.0046 5.21791 26.9905 4.95515C26.9764 4.69239 26.8592 4.44579 26.6645 4.26882C26.4697 4.09185 26.2131 3.99876 25.9502 4.00974C25.6873 4.02073 25.4393 4.1349 25.26 4.3275L17.905 12.4175L12.8437 4.46375C12.7535 4.32169 12.6289 4.20471 12.4814 4.12365C12.3339 4.04258 12.1683 4.00005 12 4H6C5.8207 3.99991 5.64468 4.04803 5.49036 4.13932C5.33604 4.23062 5.20911 4.36172 5.12285 4.5189C5.03659 4.67609 4.99417 4.85357 5.00005 5.03278C5.00593 5.21198 5.05988 5.3863 5.15625 5.5375L12.9812 17.8337L5.26 26.3337C5.16983 26.4306 5.09979 26.5444 5.05392 26.6685C5.00806 26.7927 4.98728 26.9247 4.99281 27.0569C4.99833 27.1891 5.03004 27.3189 5.0861 27.4388C5.14216 27.5586 5.22146 27.6662 5.31939 27.7552C5.41732 27.8442 5.53194 27.9129 5.65661 27.9572C5.78128 28.0016 5.91352 28.0208 6.04566 28.0137C6.1778 28.0066 6.30721 27.9733 6.4264 27.9158C6.54559 27.8583 6.65218 27.7777 6.74 27.6787L14.095 19.5888L19.1562 27.5425C19.2472 27.6834 19.3722 27.7991 19.5196 27.8791C19.6671 27.959 19.8323 28.0006 20 28H26C26.1791 27.9999 26.3549 27.9518 26.509 27.8606C26.6632 27.7693 26.79 27.6384 26.8762 27.4814C26.9624 27.3244 27.0049 27.1472 26.9992 26.9681C26.9935 26.7891 26.9398 26.6149 26.8438 26.4638ZM20.5487 26L7.82125 6H11.4462L24.1787 26H20.5487Z" />
          </svg>
          <div className={tooltip}>
            SHARE ON X
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        {showCodeButton && (
          <div className="relative group">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="32"
              height="32"
              viewBox="0 0 32 32"
              className="cursor-pointer fill-stamp-grey-darker hover:fill-stamp-grey-light"
              onClick={toggleCodeModal}
              role="button"
              aria-label="View Code"
            >
              <path d="M8.63994 11.7688L3.56244 16L8.63994 20.2313C8.74375 20.3144 8.82994 20.4173 8.89347 20.5342C8.95701 20.651 8.9966 20.7793 9.00995 20.9116C9.02329 21.0439 9.01012 21.1775 8.9712 21.3047C8.93228 21.4318 8.86839 21.5499 8.78327 21.6521C8.69815 21.7542 8.59352 21.8384 8.47548 21.8996C8.35745 21.9609 8.22839 21.9979 8.09585 22.0087C7.96332 22.0194 7.82997 22.0036 7.70361 21.9622C7.57725 21.9208 7.46041 21.8546 7.35994 21.7675L1.35994 16.7675C1.24736 16.6737 1.15678 16.5562 1.09462 16.4235C1.03246 16.2908 1.00024 16.146 1.00024 15.9994C1.00024 15.8528 1.03246 15.7081 1.09462 15.5753C1.15678 15.4426 1.24736 15.3251 1.35994 15.2313L7.35994 10.2313C7.56383 10.0615 7.82679 9.97975 8.09098 10.0039C8.35518 10.028 8.59896 10.1561 8.76869 10.36C8.93843 10.5639 9.02023 10.8269 8.99608 11.0911C8.97194 11.3553 8.84383 11.599 8.63994 11.7688ZM30.6399 15.2313L24.6399 10.2313C24.539 10.1472 24.4225 10.0839 24.297 10.0449C24.1716 10.0059 24.0397 9.99194 23.9089 10.0039C23.7781 10.0159 23.6509 10.0535 23.5346 10.1146C23.4183 10.1757 23.3152 10.2591 23.2312 10.36C23.0615 10.5639 22.9797 10.8269 23.0038 11.0911C23.028 11.3553 23.1561 11.599 23.3599 11.7688L28.4374 16L23.3599 20.2313C23.2561 20.3144 23.1699 20.4173 23.1064 20.5342C23.0429 20.651 23.0033 20.7793 22.9899 20.9116C22.9766 21.0439 22.9898 21.1775 23.0287 21.3047C23.0676 21.4318 23.1315 21.5499 23.2166 21.6521C23.3017 21.7542 23.4064 21.8384 23.5244 21.8996C23.6424 21.9609 23.7715 21.9979 23.904 22.0087C24.0366 22.0194 24.1699 22.0036 24.2963 21.9622C24.4226 21.9208 24.5395 21.8546 24.6399 21.7675L30.6399 16.7675C30.7525 16.6737 30.8431 16.5562 30.9053 16.4235C30.9674 16.2908 30.9996 16.146 30.9996 15.9994C30.9996 15.8528 30.9674 15.7081 30.9053 15.5753C30.8431 15.4426 30.7525 15.3251 30.6399 15.2313ZM20.3412 4.06003C20.2178 4.01522 20.0867 3.99515 19.9555 4.00099C19.8243 4.00682 19.6955 4.03844 19.5766 4.09404C19.4576 4.14964 19.3507 4.22813 19.2621 4.32503C19.1734 4.42193 19.1048 4.53534 19.0599 4.65878L11.0599 26.6588C11.0149 26.7823 10.9947 26.9135 11.0005 27.0448C11.0062 27.1761 11.0378 27.3051 11.0934 27.4242C11.149 27.5433 11.2276 27.6503 11.3246 27.739C11.4216 27.8277 11.5351 27.8965 11.6587 27.9413C11.7683 27.9802 11.8837 28.0001 11.9999 28C12.2053 28 12.4057 27.9368 12.5739 27.819C12.742 27.7011 12.8699 27.5343 12.9399 27.3413L20.9399 5.34128C20.9848 5.21784 21.0048 5.08678 20.999 4.95558C20.9932 4.82439 20.9615 4.69562 20.9059 4.57665C20.8503 4.45767 20.7718 4.35081 20.6749 4.26217C20.578 4.17353 20.4646 4.10484 20.3412 4.06003Z" />
            </svg>
            <div className={tooltip}>
              VIEW CODE
            </div>
          </div>
        )}
        <div className="relative group">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            viewBox="0 0 32 32"
            className="cursor-pointer fill-stamp-grey-darker hover:fill-stamp-grey-light"
            onClick={toggleFullScreenModal}
            role="button"
            aria-label="View Fullscreen"
          >
            <path d="M27 6V11C27 11.2652 26.8946 11.5196 26.7071 11.7071C26.5196 11.8946 26.2652 12 26 12C25.7348 12 25.4804 11.8946 25.2929 11.7071C25.1054 11.5196 25 11.2652 25 11V7H21C20.7348 7 20.4804 6.89464 20.2929 6.70711C20.1054 6.51957 20 6.26522 20 6C20 5.73478 20.1054 5.48043 20.2929 5.29289C20.4804 5.10536 20.7348 5 21 5H26C26.2652 5 26.5196 5.10536 26.7071 5.29289C26.8946 5.48043 27 5.73478 27 6ZM11 25H7V21C7 20.7348 6.89464 20.4804 6.70711 20.2929C6.51957 20.1054 6.26522 20 6 20C5.73478 20 5.48043 20.1054 5.29289 20.2929C5.10536 20.4804 5 20.7348 5 21V26C5 26.2652 5.10536 26.5196 5.29289 26.7071C5.48043 26.8946 5.73478 27 6 27H11C11.2652 27 11.5196 26.8946 11.7071 26.7071C11.8946 26.5196 12 26.2652 12 26C12 25.7348 11.8946 25.4804 11.7071 25.2929C11.5196 25.1054 11.2652 25 11 25ZM26 20C25.7348 20 25.4804 20.1054 25.2929 20.2929C25.1054 20.4804 25 20.7348 25 21V25H21C20.7348 25 20.4804 25.1054 20.2929 25.2929C20.1054 25.4804 20 25.7348 20 26C20 26.2652 20.1054 26.5196 20.2929 26.7071C20.4804 26.8946 20.7348 27 21 27H26C26.2652 27 26.5196 26.8946 26.7071 26.7071C26.8946 26.5196 27 26.2652 27 26V21C27 20.7348 26.8946 20.4804 26.7071 20.2929C26.5196 20.1054 26.2652 20 26 20ZM11 5H6C5.73478 5 5.48043 5.10536 5.29289 5.29289C5.10536 5.48043 5 5.73478 5 6V11C5 11.2652 5.10536 11.5196 5.29289 11.7071C5.48043 11.8946 5.73478 12 6 12C6.26522 12 6.51957 11.8946 6.70711 11.7071C6.89464 11.5196 7 11.2652 7 11V7H11C11.2652 7 11.5196 6.89464 11.7071 6.70711C11.8946 6.51957 12 6.26522 12 6C12 5.73478 11.8946 5.48043 11.7071 5.29289C11.5196 5.10536 11.2652 5 11 5Z" />
          </svg>
          <div className={tooltip}>
            FULLSCREEN
          </div>
        </div>
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
                className="max-w-none object-contain rounded-sm pixelart stamp-image h-full w-full"
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
            className={`max-w-none object-contain rounded-sm ${className} pixelart stamp-image`}
            src={src}
            alt="Not Available"
          />
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && isHtml && (
        <div className={`${className} flex flex-col gap-3 mobileMd:gap-6`}>
          <div className="relative dark-gradient p-3 mobileMd:p-6">
            <div className="stamp-container">
              <div className="relative pt-[100%]">
                <iframe
                  width="100%"
                  height="100%"
                  scrolling="no"
                  className={`${className} rounded-sm absolute top-0 left-0`}
                  sandbox="allow-scripts allow-same-origin"
                  src={src}
                  loading="lazy"
                  style={{ transform }}
                  onError={handleImageError}
                  title="Stamp"
                />
              </div>
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
        <div className="flex flex-col gap-3 mobileMd:gap-6">
          <div className="relative p-3 mobileMd:p-6 dark-gradient">
            <div className="stamp-container">
              <div className="relative z-10 aspect-square">
                {validatedContent || (
                  <img
                    width="100%"
                    loading="lazy"
                    className="max-w-none object-contain rounded-sm pixelart stamp-image h-full w-full"
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
          handleCloseModal={handleCloseFullScreenModal}
          contentType={stamp.stamp_mimetype === "text/html" ? "html" : "image"}
        />
      )}
    </>
  );
}
export default StampImage;
