/* ===== STAMP IMAGE COMPONENT ===== */
/* @baba-update audio icon size (custom) - 780*/
import { useEffect, useRef, useState } from "preact/hooks";
import { VNode } from "preact";
import { StampRow } from "$globals";
import { getStampImageSrc, handleImageError } from "$lib/utils/imageUtils.ts";
import { AUDIO_FILE_IMAGE, NOT_AVAILABLE_IMAGE } from "$lib/utils/constants.ts";
import TextContentIsland from "$islands/content/stampDetailContent/StampTextContent.tsx";
import PreviewCodeModal from "$islands/modal/PreviewCodeModal.tsx";
import PreviewImageModal from "$islands/modal/PreviewImageModal.tsx";
import { logger } from "$lib/utils/logger.ts";
import { tooltipIcon } from "$notification";
import { openModal } from "$islands/modal/states.ts";
import { Icon } from "$icon";

/* ===== RIGHT PANEL SUBCOMPONENT ===== */
function RightPanel(
  { stamp, toggleCodeModal, toggleFullScreenModal, showCodeButton }: {
    stamp: StampRow;
    toggleCodeModal: () => void;
    toggleFullScreenModal: () => void;
    showCodeButton: boolean;
  },
) {
  /* ===== STATE & REFS ===== */
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

  const [isToolsTooltipVisible, setIsToolsTooltipVisible] = useState(false);
  const toolsTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== EFFECTS ===== */
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

  /* ===== SHARING CONFIGURATION ===== */
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

  /* ===== EVENT HANDLERS ===== */
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

  const handleToolsMouseEnter = () => {
    if (toolsTooltipTimeoutRef.current) {
      globalThis.clearTimeout(toolsTooltipTimeoutRef.current);
    }
    toolsTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsToolsTooltipVisible(true);
    }, 1500);
  };

  const handleToolsMouseLeave = () => {
    if (toolsTooltipTimeoutRef.current) {
      globalThis.clearTimeout(toolsTooltipTimeoutRef.current);
    }
    setIsToolsTooltipVisible(false);
  };

  /* ===== RENDER ===== */
  return (
    <div className="flex justify-between py-3 px-6 dark-gradient rounded-lg">
      <div className="flex gap-[18px] tablet:gap-3">
        <div
          ref={copyButtonRef}
          class="relative"
          onMouseEnter={handleCopyMouseEnter}
          onMouseLeave={handleCopyMouseLeave}
        >
          <Icon
            type="iconLink"
            name="copy"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={copyLink}
            role="button"
          />
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
          <Icon
            type="iconLink"
            name="twitter"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={shareToX}
            role="button"
            aria-label="Share on X"
          />
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
          <Icon
            type="iconLink"
            name="share"
            weight="normal"
            size="custom"
            color="grey"
            className="w-6 h-6 tablet:w-[22px] tablet:h-[22px]"
            onClick={shareContent}
            role="button"
            ariaLabel="Share content"
          />
          <div
            class={`${tooltipIcon} ${
              isShareTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            SHARE
          </div>
        </div>
      </div>
      <div className="flex gap-[18px] tablet:gap-3">
        {showCodeButton && (
          <div
            ref={codeButtonRef}
            class="relative"
            onMouseEnter={handleCodeMouseEnter}
            onMouseLeave={handleCodeMouseLeave}
          >
            <Icon
              type="iconLink"
              name="previewCode"
              weight="normal"
              size="custom"
              color="grey"
              className="w-[26px] h-[26px] tablet:w-[24px] tablet:h-[24px]"
              onClick={() => {
                setIsCodeTooltipVisible(false);
                toggleCodeModal();
              }}
              role="button"
              ariaLabel="View html code"
            />
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
          class="relative"
          onMouseEnter={handleToolsMouseEnter}
          onMouseLeave={handleToolsMouseLeave}
        >
          <Icon
            type="iconLink"
            name="imageExternal"
            weight="normal"
            size="mdR"
            color="grey"
            onClick={() =>
              globalThis.open(
                `/s/${stamp.cpid}`,
                "targetWindow",
                `top=0,left=${
                  globalThis.screen.availWidth - 600
                },width=600,height=600,
                toolbar=no,location=no,status=no,menubar=no,scrollbars=no,resizable=no`,
              )}
            role="button"
            ariaLabel="View raw original image in external window"
          />
          <div
            class={`${tooltipIcon} ${
              isToolsTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            VIEW ORIGINAL
          </div>
        </div>
        <div
          ref={fullscreenButtonRef}
          class="relative"
          onMouseEnter={handleFullscreenMouseEnter}
          onMouseLeave={handleFullscreenMouseLeave}
        >
          <Icon
            type="iconLink"
            name="fullscreen"
            weight="normal"
            size="custom"
            color="grey"
            className="w-7 h-7 tablet:w-[26px] tablet:h-[26px] -mt-[1px] tablet:mt-0"
            onClick={() => {
              setIsFullscreenTooltipVisible(false);
              toggleFullScreenModal();
            }}
            role="button"
            ariaLabel="View image in fullscreen"
          />
          <div
            class={`${tooltipIcon} ${
              isFullscreenTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            VIEW FULLSCREEN
          </div>
        </div>
      </div>
    </div>
  );
}

/* ===== MAIN STAMP IMAGE COMPONENT ===== */
export function StampImage(
  { stamp, className, flag }: {
    stamp: StampRow;
    className?: string;
    flag?: boolean;
  },
) {
  /* ===== STATE & REFS ===== */
  const [loading, setLoading] = useState<boolean>(true);
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

  const toggleFullScreenModal = () => {
    const modalContent = (
      <PreviewImageModal
        src={src}
        contentType={stamp.stamp_mimetype === "text/html"
          ? "html"
          : stamp.stamp_mimetype === "text/plain"
          ? "text"
          : "image"}
      />
    );
    openModal(modalContent, "zoomInOut");
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
    fetchStampImage().catch((error) => {
      console.error("Error fetching stamp image:", error);
      setLoading(false); // Ensure loading is set to false even on error
    });
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
  const [isValidating, setIsValidating] = useState<boolean>(false);

  useEffect(() => {
    const validateContent = async () => {
      if (stamp.stamp_mimetype === "image/svg+xml" && src) {
        setIsValidating(true);

        try {
          // Fetch the SVG content
          const response = await fetch(src);
          if (!response.ok) {
            throw new Error(`Failed to fetch SVG: ${response.status}`);
          }

          const svgContent = await response.text();

          // Check if SVG has external ordinals.com references
          if (svgContent.includes("ordinals.com/content/")) {
            // Rewrite external references to use our proxy
            let rewrittenSVG = svgContent.replace(
              /https:\/\/ordinals\.com\/content\/([^"'\s>]+)/g,
              "/api/proxy/ordinals/$1",
            );

            // Ensure SVG fills container by removing fixed dimensions and adding proper styling
            if (rewrittenSVG.includes("<svg")) {
              // Remove width and height attributes
              rewrittenSVG = rewrittenSVG.replace(
                /<svg([^>]*)\s+width="([^"]*)"([^>]*)/,
                "<svg$1$3",
              ).replace(
                /<svg([^>]*)\s+height="([^"]*)"([^>]*)/,
                "<svg$1$3",
              );

              // Add viewBox if not present (using the original dimensions)
              if (!rewrittenSVG.includes("viewBox")) {
                rewrittenSVG = rewrittenSVG.replace(
                  /<svg([^>]*)>/,
                  '<svg$1 viewBox="0 0 460 500">',
                );
              }

              // Add responsive styling to fill container properly
              rewrittenSVG = rewrittenSVG.replace(
                /<svg([^>]*)>/,
                '<svg$1 style="max-width: 100%; max-height: 100%; width: auto; height: auto; display: block;">',
              );
            }

            setValidatedContent(
              <div
                className="max-w-none object-contain rounded pixelart stamp-image h-full w-full flex items-center justify-center"
                dangerouslySetInnerHTML={{ __html: rewrittenSVG }}
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                }}
              />,
            );
          } else {
            // No external references, use original src
            setValidatedContent(
              <img
                width="100%"
                loading="lazy"
                className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
                src={src}
                onError={handleImageError}
                alt={`Stamp No. ${stamp.stamp}`}
              />,
            );
          }
        } catch (_error) {
          // Fallback to original src
          setValidatedContent(
            <img
              width="100%"
              loading="lazy"
              className="max-w-none object-contain rounded pixelart stamp-image h-full w-full"
              src={src}
              onError={handleImageError}
              alt={`Stamp No. ${stamp.stamp}`}
            />,
          );
        }

        setIsValidating(false);
      } else {
        setIsValidating(false);
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

  // Update the toggleCodeModal function to use the new pattern
  const toggleCodeModal = () => {
    const modalContent = (
      <PreviewCodeModal
        src={htmlContent || src}
      />
    );
    openModal(modalContent, "zoomInOut");
  };

  const isLoadingOrValidating = loading ||
    (stamp.stamp_mimetype === "image/svg+xml" && isValidating);

  if (isLoadingOrValidating) {
    return (
      <div className="flex flex-col gap-3 mobileMd:gap-6">
        <div className="relative p-3 mobileMd:p-6 dark-gradient rounded-lg">
          <div className="stamp-container">
            <div className="relative z-10 aspect-square animate-pulse">
              <div class="flex items-center justify-center bg-[#220033CC] max-w-none object-contain rounded-lg pixelart stamp-image">
                <svg
                  class="p-[25%] text-stamp-purple-dark"
                  aria-hidden="true"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="currentColor"
                  viewBox="0 0 32 32"
                >
                  <path d="M27.5 28C27.5 28.1326 27.4473 28.2598 27.3536 28.3536C27.2598 28.4473 27.1326 28.5 27 28.5H5C4.86739 28.5 4.74021 28.4473 4.64645 28.3536C4.55268 28.2598 4.5 28.1326 4.5 28C4.5 27.8674 4.55268 27.7402 4.64645 27.6464C4.74021 27.5527 4.86739 27.5 5 27.5H27C27.1326 27.5 27.2598 27.5527 27.3536 27.6464C27.4473 27.7402 27.5 27.8674 27.5 28ZM27.5 18V23C27.5 23.3978 27.342 23.7794 27.0607 24.0607C26.7794 24.342 26.3978 24.5 26 24.5H6C5.60218 24.5 5.22064 24.342 4.93934 24.0607C4.65804 23.7794 4.5 23.3978 4.5 23V18C4.5 17.6022 4.65804 17.2206 4.93934 16.9393C5.22064 16.658 5.60218 16.5 6 16.5H13.6713L11.5787 6.73375C11.4694 6.22352 11.4754 5.69528 11.5965 5.1877C11.7177 4.68012 11.9507 4.20604 12.2787 3.80017C12.6067 3.39429 13.0213 3.06689 13.4921 2.84193C13.963 2.61697 14.4782 2.50015 15 2.5H17C17.5219 2.49996 18.0373 2.61665 18.5083 2.84153C18.9793 3.06641 19.394 3.39378 19.7221 3.79968C20.0503 4.20558 20.2835 4.67972 20.4046 5.18739C20.5258 5.69507 20.5319 6.22341 20.4225 6.73375L18.3288 16.5H26C26.3978 16.5 26.7794 16.658 27.0607 16.9393C27.342 17.2206 27.5 17.6022 27.5 18ZM14.6938 16.5H17.3062L19.4438 6.52375C19.5218 6.15932 19.5174 5.78205 19.4309 5.41954C19.3444 5.05702 19.1779 4.71844 18.9436 4.42858C18.7093 4.13871 18.4132 3.90489 18.0769 3.74422C17.7407 3.58356 17.3727 3.50012 17 3.5H15C14.6272 3.49993 14.2591 3.58323 13.9227 3.74382C13.5862 3.9044 13.2899 4.1382 13.0555 4.42809C12.8211 4.71798 12.6545 5.05663 12.5679 5.41923C12.4813 5.78184 12.4769 6.15922 12.555 6.52375L14.6938 16.5ZM26.5 18C26.5 17.8674 26.4473 17.7402 26.3536 17.6464C26.2598 17.5527 26.1326 17.5 26 17.5H6C5.86739 17.5 5.74021 17.5527 5.64645 17.6464C5.55268 17.7402 5.5 17.8674 5.5 18V23C5.5 23.1326 5.55268 23.2598 5.64645 23.3536C5.74021 23.4473 5.86739 23.5 6 23.5H26C26.1326 23.5 26.2598 23.4473 26.3536 23.3536C26.4473 23.2598 26.5 23.1326 26.5 23V18Z" />
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
                  className={`${
                    className || ""
                  } rounded absolute top-0 left-0 pointer-events-none`}
                  sandbox="allow-scripts allow-same-origin"
                  src={src || ""}
                  loading="lazy"
                  style={{ transform: transform || "none" }}
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
              showCodeButton
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
            <div className="stamp-container relative group">
              <img
                src={AUDIO_FILE_IMAGE}
                alt="Audio File"
                className="absolute top-0 left-0 w-full h-full object-contain rounded pixelart stamp-image pointer-events-none select-none"
                draggable={false}
              />
              <div className="absolute inset-0 flex items-center justify-center">
                <audio
                  ref={audioRef}
                  className="hidden"
                  onEnded={handleAudioEnded}
                >
                  <source src={src} type={stamp.stamp_mimetype} />
                </audio>
                <button
                  type="button"
                  onClick={togglePlayback}
                  className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 z-10 w-[10%] h-[10%] rounded-full flex items-center justify-center group"
                >
                  <div className="absolute inset-0 bg-black opacity-50 rounded-full" />
                  <Icon
                    name={isPlaying ? "pause" : "play"}
                    type="iconLink"
                    weight="bold"
                    size="xxl"
                    color="grey"
                    className="p-[25%] relative z-10"
                  />
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
            <div className="flex flex-col gap-6">
              <div className="relative p-6 dark-gradient rounded-lg">
                <div className="stamp-container">
                  <div className="relative z-10 aspect-square flex items-center justify-center">
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
              <div className="relative z-10 aspect-square flex items-center justify-center">
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
    </>
  );
}

export default StampImage;
