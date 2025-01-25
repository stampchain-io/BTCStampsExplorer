import { useEffect, useRef, useState } from "preact/hooks";
import { VNode } from "preact";
import { StampRow } from "$globals";
import {
  getStampImageSrc,
  handleImageError,
  validateStampContent,
} from "$lib/utils/imageUtils.ts";
import { NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import TextContentIsland from "$islands/stamp/details/StampTextContent.tsx";
import StampCodeModal from "$islands/stamp/details/StampCodeModal.tsx";
import StampImageFullScreen from "$islands/stamp/details/StampImageFullScreen.tsx";
import { logger } from "$lib/utils/logger.ts";

function RightPanel(
  { stamp, toggleCodeModal, toggleFullScreenModal, showCodeButton }: {
    stamp: StampRow;
    toggleCodeModal: () => void;
    toggleFullScreenModal: () => void;
    showCodeButton: boolean;
  },
) {
  if (stamp.ident === "SRC-20") {
    return null;
  }

  const url = `https://stampchain.io/stamp/${stamp.stamp}`;
  const text = "Check out what I found @Stampchain";

  const shareContent = async () => {
    const shareData = {
      title: text,
      text: text,
      url: url,
    };

    try {
      setIsShareTooltipVisible(false);
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        alert("Sharing is not supported in your browser.");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  const [showCopied, setShowCopied] = useState(false);
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const copyButtonRef = useRef<HTMLDivElement>(null);
  const tooltipTimeoutRef = useRef<number | null>(null);

  const [isXTooltipVisible, setIsXTooltipVisible] = useState(false);
  const [allowXTooltip, setAllowXTooltip] = useState(true);
  const xButtonRef = useRef<HTMLDivElement>(null);
  const xTooltipTimeoutRef = useRef<number | null>(null);

  const [isShareTooltipVisible, setIsShareTooltipVisible] = useState(false);
  const [allowShareTooltip, setAllowShareTooltip] = useState(true);
  const shareButtonRef = useRef<HTMLDivElement>(null);
  const shareTooltipTimeoutRef = useRef<number | null>(null);

  // Add new state and refs for code tooltip
  const [isCodeTooltipVisible, setIsCodeTooltipVisible] = useState(false);
  const [allowCodeTooltip, setAllowCodeTooltip] = useState(true);
  const codeButtonRef = useRef<HTMLDivElement>(null);
  const codeTooltipTimeoutRef = useRef<number | null>(null);

  const [isFullscreenTooltipVisible, setIsFullscreenTooltipVisible] = useState(
    false,
  );
  const [allowFullscreenTooltip, setAllowFullscreenTooltip] = useState(true);
  const fullscreenButtonRef = useRef<HTMLDivElement>(null);
  const fullscreenTooltipTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (xTooltipTimeoutRef.current) {
        globalThis.clearTimeout(xTooltipTimeoutRef.current);
      }
      if (shareTooltipTimeoutRef.current) {
        globalThis.clearTimeout(shareTooltipTimeoutRef.current);
      }
      if (codeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(codeTooltipTimeoutRef.current);
      }
      if (fullscreenTooltipTimeoutRef.current) {
        globalThis.clearTimeout(fullscreenTooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleXMouseEnter = () => {
    if (allowXTooltip) {
      if (xTooltipTimeoutRef.current) {
        globalThis.clearTimeout(xTooltipTimeoutRef.current);
      }

      xTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = xButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsXTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleXMouseLeave = () => {
    if (xTooltipTimeoutRef.current) {
      globalThis.clearTimeout(xTooltipTimeoutRef.current);
    }
    setIsXTooltipVisible(false);
    setAllowXTooltip(true);
  };

  const handleCopyMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = copyButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleCopyMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setShowCopied(false);
    setAllowTooltip(true);
  };

  const shareToX = () => {
    const xShareUrl = `https://x.com/intent/post?text=${
      encodeURIComponent(text)
    }&url=${encodeURIComponent(url)}`;
    setIsXTooltipVisible(false);
    globalThis.open(xShareUrl, "_blank", "noopener,noreferrer");
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setShowCopied(true);
      setIsTooltipVisible(false);
      setAllowTooltip(false);

      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }

      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setShowCopied(false);
      }, 1500);
    } catch (error) {
      console.error("Error copying to clipboard:", error);
    }
  };

  const handleShareMouseEnter = () => {
    if (allowShareTooltip) {
      if (shareTooltipTimeoutRef.current) {
        globalThis.clearTimeout(shareTooltipTimeoutRef.current);
      }

      shareTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = shareButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsShareTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleShareMouseLeave = () => {
    if (shareTooltipTimeoutRef.current) {
      globalThis.clearTimeout(shareTooltipTimeoutRef.current);
    }
    setIsShareTooltipVisible(false);
    setAllowShareTooltip(true);
  };

  // Add handlers for code tooltip
  const handleCodeMouseEnter = () => {
    if (allowCodeTooltip) {
      if (codeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(codeTooltipTimeoutRef.current);
      }

      codeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = codeButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsCodeTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleCodeMouseLeave = () => {
    if (codeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(codeTooltipTimeoutRef.current);
    }
    setIsCodeTooltipVisible(false);
    setAllowCodeTooltip(true);
  };

  // Add handlers for fullscreen tooltip
  const handleFullscreenMouseEnter = () => {
    if (allowFullscreenTooltip) {
      if (fullscreenTooltipTimeoutRef.current) {
        globalThis.clearTimeout(fullscreenTooltipTimeoutRef.current);
      }

      fullscreenTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        const buttonRect = fullscreenButtonRef.current?.getBoundingClientRect();
        if (buttonRect) {
          setIsFullscreenTooltipVisible(true);
        }
      }, 1500);
    }
  };

  const handleFullscreenMouseLeave = () => {
    if (fullscreenTooltipTimeoutRef.current) {
      globalThis.clearTimeout(fullscreenTooltipTimeoutRef.current);
    }
    setIsFullscreenTooltipVisible(false);
    setAllowFullscreenTooltip(true);
  };

  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";

  return (
    <div className="flex justify-between pt-[10px] mobileMd:pt-[22px] pb-2 mobileMd:pb-5 px-3 mobileMd:px-6 dark-gradient rounded-lg">
      <div className="flex gap-3">
        <div
          ref={copyButtonRef}
          class="relative"
          onMouseEnter={handleCopyMouseEnter}
          onMouseLeave={handleCopyMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-7 h-7 mobileLg:w-8 mobileLg:h-8 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer mb-0.5"
            onClick={copyLink}
            role="button"
            aria-label="Copy Link"
          >
            <path d="M27 4H11C10.7348 4 10.4804 4.10536 10.2929 4.29289C10.1054 4.48043 10 4.73478 10 5V10H5C4.73478 10 4.48043 10.1054 4.29289 10.2929C4.10536 10.4804 4 10.7348 4 11V27C4 27.2652 4.10536 27.5196 4.29289 27.7071C4.48043 27.8946 4.73478 28 5 28H21C21.2652 28 21.5196 27.8946 21.7071 27.7071C21.8946 27.5196 22 27.2652 22 27V22H27C27.2652 22 27.5196 21.8946 27.7071 21.7071C27.8946 21.5196 28 21.2652 28 21V5C28 4.73478 27.8946 4.48043 27.7071 4.29289C27.5196 4.10536 27.2652 4 27 4ZM20 26H6V12H20V26ZM26 20H22V11C22 10.7348 21.8946 10.4804 21.7071 10.2929C21.5196 10.1054 21.2652 10 21 10H12V6H26V20Z" />
          </svg>
          <div
            class={`${tooltipIcon} ${
              isTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            COPY LINK
          </div>
          <div
            class={`${tooltipIcon} ${showCopied ? "opacity-100" : "opacity-0"}`}
          >
            LINK COPIED
          </div>
        </div>
        <div
          ref={xButtonRef}
          class="relative"
          onMouseEnter={handleXMouseEnter}
          onMouseLeave={handleXMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-7 h-7 mobileLg:w-8 mobileLg:h-8 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
            onClick={shareToX}
            role="button"
            aria-label="Share on X"
          >
            <path d="M26.8438 26.4638L19.0187 14.1663L26.74 5.6725C26.9146 5.47565 27.0046 5.21791 26.9905 4.95515C26.9764 4.69239 26.8592 4.44579 26.6645 4.26882C26.4697 4.09185 26.2131 3.99876 25.9502 4.00974C25.6873 4.02073 25.4393 4.1349 25.26 4.3275L17.905 12.4175L12.8437 4.46375C12.7535 4.32169 12.6289 4.20471 12.4814 4.12365C12.3339 4.04258 12.1683 4.00005 12 4H6C5.8207 3.99991 5.64468 4.04803 5.49036 4.13932C5.33604 4.23062 5.20911 4.36172 5.12285 4.5189C5.03659 4.67609 4.99417 4.85357 5.00005 5.03278C5.00593 5.21198 5.05988 5.3863 5.15625 5.5375L12.9812 17.8337L5.26 26.3337C5.16983 26.4306 5.09979 26.5444 5.05392 26.6685C5.00806 26.7927 4.98728 26.9247 4.99281 27.0569C4.99833 27.1891 5.03004 27.3189 5.0861 27.4388C5.14216 27.5586 5.22146 27.6662 5.31939 27.7552C5.41732 27.8442 5.53194 27.9129 5.65661 27.9572C5.78128 28.0016 5.91352 28.0208 6.04566 28.0137C6.1778 28.0066 6.30721 27.9733 6.4264 27.9158C6.54559 27.8583 6.65218 27.7777 6.74 27.6787L14.095 19.5888L19.1562 27.5425C19.2472 27.6834 19.3722 27.7991 19.5196 27.8791C19.6671 27.959 19.8323 28.0006 20 28H26C26.1791 27.9999 26.3549 27.9518 26.509 27.8606C26.6632 27.7693 26.79 27.6384 26.8762 27.4814C26.9624 27.3244 27.0049 27.1472 26.9992 26.9681C26.9935 26.7891 26.9398 26.6149 26.8438 26.4638ZM20.5487 26L7.82125 6H11.4462L24.1787 26H20.5487Z" />
          </svg>
          <div
            class={`${tooltipIcon} ${
              isXTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            SHARE ON X
          </div>
        </div>
        <div
          ref={shareButtonRef}
          class="relative"
          onMouseEnter={handleShareMouseEnter}
          onMouseLeave={handleShareMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            className="w-6 h-6 mobileLg:w-[28px] mobileLg:h-[28px] fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer mt-[2px]"
            onClick={shareContent}
            role="button"
            aria-label="Share Content"
          >
            <path d="M22.0001 20.0001C21.333 19.9999 20.6726 20.1335 20.0581 20.3931C19.4436 20.6527 18.8875 21.0329 18.4226 21.5113L12.6601 17.8076C13.1133 16.6452 13.1133 15.355 12.6601 14.1926L18.4226 10.4888C19.2881 11.3755 20.4521 11.9092 21.6888 11.9864C22.9255 12.0636 24.1468 11.6789 25.1159 10.9068C26.085 10.1347 26.733 9.03025 26.9341 7.80758C27.1352 6.58492 26.8751 5.33113 26.2043 4.28931C25.5335 3.24749 24.4998 2.49186 23.3035 2.16891C22.1073 1.84596 20.8337 1.97871 19.7297 2.54142C18.6258 3.10412 17.7701 4.0567 17.3286 5.21446C16.887 6.37222 16.8911 7.65269 17.3401 8.8076L11.5776 12.5113C10.8836 11.7989 9.99304 11.3097 9.0196 11.106C8.04617 10.9024 7.03412 10.9937 6.11284 11.3682C5.19155 11.7428 4.40289 12.3835 3.84765 13.2086C3.29242 14.0337 2.99585 15.0056 2.99585 16.0001C2.99585 16.9946 3.29242 17.9665 3.84765 18.7916C4.40289 19.6167 5.19155 20.2574 6.11284 20.632C7.03412 21.0065 8.04617 21.0978 9.0196 20.8942C9.99304 20.6905 10.8836 20.2013 11.5776 19.4888L17.3401 23.1926C16.954 24.1883 16.8969 25.2814 17.177 26.3118C17.4572 27.3423 18.0599 28.256 18.8969 28.9192C19.734 29.5823 20.7613 29.9601 21.8285 29.9971C22.8958 30.0341 23.9468 29.7285 24.8278 29.125C25.7088 28.5214 26.3734 27.6517 26.7243 26.6431C27.0752 25.6345 27.0939 24.5401 26.7778 23.5201C26.4617 22.5 25.8274 21.608 24.9676 20.9746C24.1079 20.3412 23.0679 19.9997 22.0001 20.0001ZM22.0001 4.0001C22.5934 4.0001 23.1734 4.17604 23.6668 4.50569C24.1601 4.83533 24.5446 5.30387 24.7717 5.85205C24.9988 6.40023 25.0582 7.00343 24.9424 7.58537C24.8267 8.16731 24.5409 8.70186 24.1214 9.12142C23.7018 9.54098 23.1673 9.8267 22.5853 9.94245C22.0034 10.0582 21.4002 9.9988 20.852 9.77174C20.3038 9.54467 19.8353 9.16016 19.5056 8.66681C19.176 8.17346 19.0001 7.59344 19.0001 7.0001C19.0001 6.20445 19.3161 5.44139 19.8787 4.87878C20.4413 4.31617 21.2044 4.0001 22.0001 4.0001ZM8.00006 19.0001C7.40671 19.0001 6.82669 18.8242 6.33335 18.4945C5.84 18.1649 5.45548 17.6963 5.22842 17.1481C5.00136 16.6 4.94195 15.9968 5.0577 15.4148C5.17346 14.8329 5.45918 14.2983 5.87874 13.8788C6.29829 13.4592 6.83284 13.1735 7.41479 13.0577C7.99673 12.942 8.59993 13.0014 9.14811 13.2285C9.69628 13.4555 10.1648 13.84 10.4945 14.3334C10.8241 14.8267 11.0001 15.4068 11.0001 16.0001C11.0001 16.7957 10.684 17.5588 10.1214 18.1214C9.55877 18.684 8.79571 19.0001 8.00006 19.0001ZM22.0001 28.0001C21.4067 28.0001 20.8267 27.8242 20.3333 27.4945C19.84 27.1649 19.4555 26.6963 19.2284 26.1481C19.0014 25.6 18.9419 24.9968 19.0577 24.4148C19.1735 23.8329 19.4592 23.2983 19.8787 22.8788C20.2983 22.4592 20.8328 22.1735 21.4148 22.0577C21.9967 21.942 22.5999 22.0014 23.1481 22.2285C23.6963 22.4555 24.1648 22.84 24.4945 23.3334C24.8241 23.8267 25.0001 24.4068 25.0001 25.0001C25.0001 25.7957 24.684 26.5588 24.1214 27.1214C23.5588 27.684 22.7957 28.0001 22.0001 28.0001Z" />
          </svg>
          <div
            class={`${tooltipIcon} ${
              isShareTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            SHARE
          </div>
        </div>
      </div>
      <div className="flex gap-4">
        {showCodeButton && (
          <div
            ref={codeButtonRef}
            class="relative"
            onMouseEnter={handleCodeMouseEnter}
            onMouseLeave={handleCodeMouseLeave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 32 32"
              class="w-7 h-7 mobileLg:w-8 mobileLg:h-8 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
              onClick={() => {
                setIsCodeTooltipVisible(false);
                toggleCodeModal();
              }}
              role="button"
              aria-label="View Code"
            >
              <path d="M8.63994 11.7688L3.56244 16L8.63994 20.2313C8.74375 20.3144 8.82994 20.4173 8.89347 20.5342C8.95701 20.651 8.9966 20.7793 9.00995 20.9116C9.02329 21.0439 9.01012 21.1775 8.9712 21.3047C8.93228 21.4318 8.86839 21.5499 8.78327 21.6521C8.69815 21.7542 8.59352 21.8384 8.47548 21.8996C8.35745 21.9609 8.22839 21.9979 8.09585 22.0087C7.96332 22.0194 7.82997 22.0036 7.70361 21.9622C7.57725 21.9208 7.46041 21.8546 7.35994 21.7675L1.35994 16.7675C1.24736 16.6737 1.15678 16.5562 1.09462 16.4235C1.03246 16.2908 1.00024 16.146 1.00024 15.9994C1.00024 15.8528 1.03246 15.7081 1.09462 15.5753C1.15678 15.4426 1.24736 15.3251 1.35994 15.2313L7.35994 10.2313C7.56383 10.0615 7.82679 9.97975 8.09098 10.0039C8.35518 10.028 8.59896 10.1561 8.76869 10.36C8.93843 10.5639 9.02023 10.8269 8.99608 11.0911C8.97194 11.3553 8.84383 11.599 8.63994 11.7688ZM30.6399 15.2313L24.6399 10.2313C24.539 10.1472 24.4225 10.0839 24.297 10.0449C24.1716 10.0059 24.0397 9.99194 23.9089 10.0039C23.7781 10.0159 23.6509 10.0535 23.5346 10.1146C23.4183 10.1757 23.3152 10.2591 23.2312 10.36C23.0615 10.5639 22.9797 10.8269 23.0038 11.0911C23.028 11.3553 23.1561 11.599 23.3599 11.7688L28.4374 16L23.3599 20.2313C23.2561 20.3144 23.1699 20.4173 23.1064 20.5342C23.0429 20.651 23.0033 20.7793 22.9899 20.9116C22.9766 21.0439 22.9898 21.1775 23.0287 21.3047C23.0676 21.4318 23.1315 21.5499 23.2166 21.6521C23.3017 21.7542 23.4064 21.8384 23.5244 21.8996C23.6424 21.9609 23.7715 21.9979 23.904 22.0087C24.0366 22.0194 24.1699 22.0036 24.2963 21.9622C24.4226 21.9208 24.5395 21.8546 24.6399 21.7675L30.6399 16.7675C30.7525 16.6737 30.8431 16.5562 30.9053 16.4235C30.9674 16.2908 30.9996 16.146 30.9996 15.9994C30.9996 15.8528 30.9674 15.7081 30.9053 15.5753C30.8431 15.4426 30.7525 15.3251 30.6399 15.2313ZM20.3412 4.06003C20.2178 4.01522 20.0867 3.99515 19.9555 4.00099C19.8243 4.00682 19.6955 4.03844 19.5766 4.09404C19.4576 4.14964 19.3507 4.22813 19.2621 4.32503C19.1734 4.42193 19.1048 4.53534 19.0599 4.65878L11.0599 26.6588C11.0149 26.7823 10.9947 26.9135 11.0005 27.0448C11.0062 27.1761 11.0378 27.3051 11.0934 27.4242C11.149 27.5433 11.2276 27.6503 11.3246 27.739C11.4216 27.8277 11.5351 27.8965 11.6587 27.9413C11.7683 27.9802 11.8837 28.0001 11.9999 28C12.2053 28 12.4057 27.9368 12.5739 27.819C12.742 27.7011 12.8699 27.5343 12.9399 27.3413L20.9399 5.34128C20.9848 5.21784 21.0048 5.08678 20.999 4.95558C20.9932 4.82439 20.9615 4.69562 20.9059 4.57665C20.8503 4.45767 20.7718 4.35081 20.6749 4.26217C20.578 4.17353 20.4646 4.10484 20.3412 4.06003Z" />
            </svg>
            <div
              class={`${tooltipIcon} ${
                isCodeTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              VIEW CODE
            </div>
          </div>
        )}
        <div
          ref={fullscreenButtonRef}
          class="relative"
          onMouseEnter={handleFullscreenMouseEnter}
          onMouseLeave={handleFullscreenMouseLeave}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            class="w-7 h-7 mobileLg:w-8 mobileLg:h-8 fill-stamp-grey-darker hover:fill-stamp-grey-light cursor-pointer"
            onClick={() => {
              setIsFullscreenTooltipVisible(false);
              toggleFullScreenModal();
            }}
            role="button"
            aria-label="View Fullscreen"
          >
            <path d="M27 6V11C27 11.2652 26.8946 11.5196 26.7071 11.7071C26.5196 11.8946 26.2652 12 26 12C25.7348 12 25.4804 11.8946 25.2929 11.7071C25.1054 11.5196 25 11.2652 25 11V7H21C20.7348 7 20.4804 6.89464 20.2929 6.70711C20.1054 6.51957 20 6.26522 20 6C20 5.73478 20.1054 5.48043 20.2929 5.29289C20.4804 5.10536 20.7348 5 21 5H26C26.2652 5 26.5196 5.10536 26.7071 5.29289C26.8946 5.48043 27 5.73478 27 6ZM11 25H7V21C7 20.7348 6.89464 20.4804 6.70711 20.2929C6.51957 20.1054 6.26522 20 6 20C5.73478 20 5.48043 20.1054 5.29289 20.2929C5.10536 20.4804 5 20.7348 5 21V26C5 26.2652 5.10536 26.5196 5.29289 26.7071C5.48043 26.8946 5.73478 27 6 27H11C11.2652 27 11.5196 26.8946 11.7071 26.7071C11.8946 26.5196 12 26.2652 12 26C12 25.7348 11.8946 25.4804 11.7071 25.2929C11.5196 25.1054 11.2652 25 11 25ZM26 20C25.7348 20 25.4804 20.1054 25.2929 20.2929C25.1054 20.4804 25 20.7348 25 21V25H21C20.7348 25 20.4804 25.1054 20.2929 25.2929C20.1054 25.4804 20 25.7348 20 26C20 26.2652 20.1054 26.5196 20.2929 26.7071C20.4804 26.8946 20.7348 27 21 27H26C26.2652 27 26.5196 26.8946 26.7071 26.7071C26.8946 26.5196 27 26.2652 27 26V21C27 20.7348 26.8946 20.4804 26.7071 20.2929C26.5196 20.1054 26.2652 20 26 20ZM11 5H6C5.73478 5 5.48043 5.10536 5.29289 5.29289C5.10536 5.48043 5 5.73478 5 6V11C5 11.2652 5.10536 11.5196 5.29289 11.7071C5.48043 11.8946 5.73478 12 6 12C6.26522 12 6.51957 11.8946 6.70711 11.7071C6.89464 11.5196 7 11.2652 7 11V7H11C11.2652 7 11.5196 6.89464 11.7071 6.70711C11.8946 6.51957 12 6.26522 12 6C12 5.73478 11.8946 5.48043 11.7071 5.29289C11.5196 5.10536 11.2652 5 11 5Z" />
          </svg>
          <div
            class={`${tooltipIcon} ${
              isFullscreenTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
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
  const [loading, setLoading] = useState<boolean>(true);
  const [isCodeModalOpen, setIsCodeModalOpen] = useState(false);
  const imgScopeRef = useRef<HTMLDivElement | null>(null);
  const [transform, setTransform] = useState("");
  const [src, setSrc] = useState("");

  const updateTransform = () => {
    if (!imgScopeRef.current) return;
    const width = imgScopeRef.current.clientWidth;
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

  const fetchStampImage = async () => {
    setLoading(true);
    const res = await getStampImageSrc(stamp);
    if (res) {
      setSrc(res);
    } else setSrc(NOT_AVAILABLE_IMAGE);
    setLoading(false);
  };

  useEffect(() => {
    fetchStampImage();
  }, []);

  const isHtml = stamp.stamp_mimetype === "text/html";
  const isPlainText = stamp.stamp_mimetype === "text/plain";
  const isAudio = stamp.stamp_mimetype?.startsWith("audio/");

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
      if (stamp.stamp_mimetype === "image/svg+xml" && src) {
        const { isValid, error } = await validateStampContent(src);
        if (isValid) {
          setValidatedContent(
            <div className="stamp-container">
              <img
                src={src}
                loading="lazy"
                alt={`Stamp No. ${stamp.stamp}`}
                className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                onError={handleImageError}
              />
            </div>,
          );
        } else {
          logger.debug("ui", {
            message: "SVG validation failed",
            error,
            stamp: stamp.stamp,
          });
          setValidatedContent(
            <div className="stamp-container">
              <img
                src={NOT_AVAILABLE_IMAGE}
                alt="Invalid SVG"
                className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
              />
            </div>,
          );
        }
      }
    };
    validateContent();
  }, [src, stamp.stamp_mimetype]);

  // All tooltip-related refs
  const tooltipTimeoutRef = useRef<number | null>(null);
  const copyTooltipTimeoutRef = useRef<number | null>(null);
  const shareTooltipTimeoutRef = useRef<number | null>(null);
  const codeTooltipTimeoutRef = useRef<number | null>(null);
  const fullscreenTooltipTimeoutRef = useRef<number | null>(null);

  // Add cleanup effect for tooltips
  useEffect(() => {
    logger.debug("ui", {
      message: "StampImage mounted",
      component: "StampImage",
    });

    return () => {
      logger.debug("ui", {
        message: "StampImage unmounting",
        component: "StampImage",
      });
      // Clean up all tooltip timeouts
      [
        tooltipTimeoutRef,
        copyTooltipTimeoutRef,
        shareTooltipTimeoutRef,
        codeTooltipTimeoutRef,
        fullscreenTooltipTimeoutRef,
        xTooltipTimeoutRef,
      ].forEach((ref) => {
        if (ref.current !== null) {
          globalThis.clearTimeout(ref.current);
          ref.current = null;
        }
      });
    };
  }, []);

  const xTooltipTimeoutRef = useRef<number | null>(null);

  // Add to cleanup useEffect
  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
      if (xTooltipTimeoutRef.current) {
        globalThis.clearTimeout(xTooltipTimeoutRef.current);
      }
    };
  }, []);

  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement>(null);

  const togglePlayback = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  if (loading) {
    return (
      <div className="flex flex-col gap-3 mobileMd:gap-6">
        <div className="relative p-3 mobileMd:p-6 dark-gradient rounded-lg">
          <div className="stamp-container">
            <div className="relative z-10 aspect-square animate-pulse">
              <div class="flex items-center justify-center bg-gray-700 max-w-none object-contain rounded pixelart stamp-image h-full w-full">
                <svg
                  class="w-40 h-40 text-gray-600"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 20 18"
                >
                  <path d="M18 0H2a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V2a2 2 0 0 0-2-2Zm-5.5 4a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3Zm4.376 10.481A1 1 0 0 1 16 15H4a1 1 0 0 1-.895-1.447l3.5-7A1 1 0 0 1 7.468 6a.965.965 0 0 1 .9.5l2.775 4.757 1.546-1.887a1 1 0 0 1 1.618.1l2.541 4a1 1 0 0 1 .028 1.011Z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      {src === NOT_AVAILABLE_IMAGE && (
        <div className="stamp-container">
          <img
            width="100%"
            loading="lazy"
            className={`max-w-none object-contain rounded ${className} pixelart stamp-image`}
            src={src}
            alt="Not Available"
          />
        </div>
      )}

      {src !== NOT_AVAILABLE_IMAGE && isHtml && (
        <div className={`${className} flex flex-col gap-3 mobileMd:gap-6`}>
          <div
            className={`relative ${
              flag ? "dark-gradient rounded-lg p-3 mobileMd:p-6" : ""
            }`}
          >
            <div className="stamp-container">
              <div className="relative pt-[100%]">
                <iframe
                  width="100%"
                  height="100%"
                  scrolling="no"
                  className={`${className} rounded absolute top-0 left-0 pointer-events-none`}
                  sandbox="allow-scripts allow-same-origin"
                  src={src}
                  loading="lazy"
                  style={{ transform }}
                  onError={handleImageError}
                  title="Stamp"
                />
                <div className="absolute inset-0 cursor-pointer" />
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
        <div className="flex flex-col gap-3 mobileMd:gap-6">
          <div className="relative dark-gradient rounded-lg p-3 mobileMd:p-6">
            <div className="stamp-container">
              <div className="relative aspect-square">
                <TextContentIsland src={src} />
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

      {src !== NOT_AVAILABLE_IMAGE && isAudio && (
        <div className={`${className} flex flex-col gap-3 mobileMd:gap-6`}>
          <div className="relative dark-gradient rounded-lg p-3 mobileMd:p-6">
            <div className="stamp-container">
              <div className="relative pt-[100%] flex items-center justify-center">
                <audio
                  ref={audioRef}
                  className="hidden"
                  onEnded={handleAudioEnded}
                >
                  <source src={src} type={stamp.stamp_mimetype} />
                </audio>
                <button
                  onClick={togglePlayback}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 text-stamp-grey-darker hover:text-stamp-grey-light w-[10%] aspect-square"
                >
                  <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[170%] h-[170%] bg-stamp-grey-darker opacity-30 rounded-full" />
                  {isPlaying
                    ? (
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      >
                        <path d="M27 6V26C27 26.5304 26.7893 27.0391 26.4142 27.4142C26.0391 27.7893 25.5304 28 25 28H20C19.4696 28 18.9609 27.7893 18.5858 27.4142C18.2107 27.0391 18 26.5304 18 26V6C18 5.46957 18.2107 4.96086 18.5858 4.58579C18.9609 4.21071 19.4696 4 20 4H25C25.5304 4 26.0391 4.21071 26.4142 4.58579C26.7893 4.96086 27 5.46957 27 6ZM12 4H7C6.46957 4 5.96086 4.21071 5.58579 4.58579C5.21071 4.96086 5 5.46957 5 6V26C5 26.5304 5.21071 27.0391 5.58579 27.4142C5.96086 27.7893 6.46957 28 7 28H12C12.5304 28 13.0391 27.7893 13.4142 27.4142C13.7893 27.0391 14 26.5304 14 26V6C14 5.46957 13.7893 4.96086 13.4142 4.58579C13.0391 4.21071 12.5304 4 12 4Z" />
                      </svg>
                    )
                    : (
                      <svg
                        className="w-full h-full"
                        viewBox="0 0 32 32"
                        fill="currentColor"
                      >
                        <path d="M30 16C30.0008 16.3395 29.9138 16.6735 29.7473 16.9694C29.5808 17.2654 29.3406 17.5132 29.05 17.6888L11.04 28.7063C10.7364 28.8922 10.3886 28.9937 10.0326 29.0003C9.67661 29.0069 9.32532 28.9183 9.015 28.7438C8.70764 28.5719 8.4516 28.3213 8.2732 28.0177C8.09481 27.7141 8.00051 27.3684 8 27.0163V4.98376C8.00051 4.63162 8.09481 4.28597 8.2732 3.98235C8.4516 3.67874 8.70764 3.42812 9.015 3.25626C9.32532 3.0817 9.67661 2.99314 10.0326 2.99973C10.3886 3.00632 10.7364 3.10783 11.04 3.29376L29.05 14.3113C29.3406 14.4869 29.5808 14.7347 29.7473 15.0306C29.9138 15.3265 30.0008 15.6605 30 16Z" />
                      </svg>
                    )}
                </button>
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

      {src !== NOT_AVAILABLE_IMAGE && !isHtml && !isPlainText && !isAudio && (
        flag
          ? (
            <div className="flex flex-col gap-3 mobileMd:gap-6">
              <div className="relative p-3 mobileMd:p-6 dark-gradient rounded-lg">
                <div className="stamp-container">
                  <div className="relative z-10 aspect-square">
                    {validatedContent || (
                      <img
                        width="100%"
                        loading="lazy"
                        className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                        src={src}
                        onError={handleImageError}
                        alt="Stamp"
                      />
                    )}
                  </div>
                </div>
              </div>
              <RightPanel
                stamp={stamp}
                toggleCodeModal={toggleCodeModal}
                toggleFullScreenModal={toggleFullScreenModal}
                showCodeButton={false}
              />
            </div>
          )
          : (
            <div className="stamp-container">
              <div className="relative z-10 aspect-square">
                {validatedContent || (
                  <img
                    width="100%"
                    loading="lazy"
                    className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                    src={src}
                    onError={handleImageError}
                    alt="Stamp"
                  />
                )}
              </div>
            </div>
          )
      )}

      {isCodeModalOpen && (
        <StampCodeModal
          src={htmlContent || src}
          toggleModal={toggleCodeModal}
          handleCloseModal={handleCloseCodeModal}
        />
      )}

      {isFullScreenModalOpen && (
        <StampImageFullScreen
          src={src}
          handleCloseModal={handleCloseFullScreenModal}
          contentType={stamp.stamp_mimetype === "text/html"
            ? "html"
            : stamp.stamp_mimetype === "text/plain"
            ? "text"
            : "image"}
        />
      )}
    </>
  );
}
export default StampImage;
