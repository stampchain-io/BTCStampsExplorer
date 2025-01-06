import axiod from "axiod";
import { useEffect, useRef, useState } from "preact/hooks";

import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { SRC20InputField } from "../SRC20InputField.tsx";
import { logger } from "$lib/utils/logger.ts";
import { getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";
import { APIResponse } from "$lib/utils/apiResponseUtil.ts";

interface UploadResponse extends APIResponse {
  url?: string;
}

export function DeployContent(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" } = { trxType: "olga" },
) {
  console.log("DeployContent trxType:", trxType);
  const {
    formState,
    setFormState,
    handleChangeFee,
    handleInputChange,
    handleSubmit,
    fetchFees,
    config,
    isSubmitting,
    submissionMessage,
    apiError,
    handleInputBlur,
  } = useSRC20Form("deploy", trxType);

  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isUploadTooltipVisible, setIsUploadTooltipVisible] = useState(false);
  const [isToggleTooltipVisible, setIsToggleTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const uploadTooltipTimeoutRef = useRef<number | null>(null);
  const toggleTooltipTimeoutRef = useRef<number | null>(null);
  const [tooltipText, setTooltipText] = useState("OPTIONAL");

  const { wallet, isConnected } = walletContext;

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleFileChange = (e: Event) => {
    const file = (e.target as HTMLInputElement).files?.[0] || null;
    if (file) {
      const img = new Image();
      img.onload = () => {
        if (img.width === 420 && img.height === 420) {
          setFormState((prev) => ({ ...prev, file }));
        } else {
          setFileUploadError("Image must be exactly 420x420 pixels.");
        }
      };
      img.onerror = () => {
        setFileUploadError("Invalid image file.");
      };
      img.src = URL.createObjectURL(file);
    } else {
      setFormState((prev) => ({ ...prev, file: null }));
    }
  };

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        const csrfToken = await getCSRFToken();

        logger.debug("stamps", {
          message: "Preparing background image upload",
          tick: formState.token,
          fileSize: file.size,
          mimeType: file.type,
          csrfTokenPresent: !!csrfToken,
          csrfTokenPreview: csrfToken ? csrfToken.slice(0, 10) + "..." : "none",
        });

        const response = await axiod.post<UploadResponse>(
          "/api/internal/src20Background",
          {
            fileData: base64String,
            tick: formState.token,
          },
          {
            headers: {
              "Content-Type": "application/json",
              "X-CSRF-Token": csrfToken,
            },
          },
        );

        if (!response.data.success) {
          throw new Error(response.data.message || "Upload failed");
        }

        logger.debug("stamps", {
          message: "Background image uploaded successfully",
          tick: formState.token,
          url: response.data.url,
        });
      } catch (error) {
        // Improved error logging
        const errorMessage = error instanceof Error
          ? error.message
          : (error as { response?: { data?: { message?: string } } })?.response
            ?.data?.message ||
            "Unknown error";

        logger.error("stamps", {
          message: "Background image upload failed",
          error: errorMessage,
          tick: formState.token,
          details: error instanceof Error ? error.stack : undefined,
        });

        setFileUploadError(
          `File upload failed: ${errorMessage}. The deployment will continue without the background image.`,
        );
      }
    };

    reader.onerror = (error) => {
      logger.error("stamps", {
        message: "Failed to read image file",
        error: error,
        tick: formState.token,
      });
      setFileUploadError("Failed to read the image file");
    };

    reader.readAsDataURL(file);
  };

  const handleSubmitWithUpload = async () => {
    if (!isConnected) {
      logger.debug("stamps", {
        message: "Showing wallet connect modal - user not connected",
      });
      walletContext.showConnectModal();
      return;
    }

    if (formState.file) {
      try {
        await handleFileUpload(formState.file);
      } catch (error) {
        console.error("File upload error:", error);
        // Continue with deployment even if file upload fails
      }
    }

    await handleSubmit();
  };

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const handleShowAdvancedOptions = () => {
    const switchToggle = document.querySelector("#switch-toggle-advanced");
    if (!switchToggle) return;
    setAllowTooltip(false);
    setIsToggleTooltipVisible(false);

    if (showAdvancedOptions !== true) {
      switchToggle.classList.add("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-dark'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-darker'></div>`;
      }, 150);
    }
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  useEffect(() => {
    const advancedToggle = document.getElementById("switch-toggle-advanced");
    if (advancedToggle) {
      advancedToggle.innerHTML =
        `<div class='w-[17px] h-[17px] mobileLg:w-5 mobileLg:h-5 rounded-full bg-stamp-purple-darker'></div>`;
    }
  }, []);

  const handleMouseMove = (e: MouseEvent) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleUploadMouseEnter = () => {
    if (uploadTooltipTimeoutRef.current) {
      globalThis.clearTimeout(uploadTooltipTimeoutRef.current);
    }

    uploadTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsUploadTooltipVisible(true);
    }, 1500);
  };

  const handleUploadMouseLeave = () => {
    if (uploadTooltipTimeoutRef.current) {
      globalThis.clearTimeout(uploadTooltipTimeoutRef.current);
    }
    setIsUploadTooltipVisible(false);
  };

  const handleToggleMouseEnter = () => {
    if (allowTooltip) {
      setTooltipText(showAdvancedOptions ? "MANDATORY" : "OPTIONAL");

      if (toggleTooltipTimeoutRef.current) {
        globalThis.clearTimeout(toggleTooltipTimeoutRef.current);
      }

      toggleTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsToggleTooltipVisible(true);
      }, 1500);
    }
  };

  const handleToggleMouseLeave = () => {
    if (toggleTooltipTimeoutRef.current) {
      globalThis.clearTimeout(toggleTooltipTimeoutRef.current);
    }
    setIsToggleTooltipVisible(false);
    setAllowTooltip(true);
  };

  useEffect(() => {
    return () => {
      if (uploadTooltipTimeoutRef.current) {
        globalThis.clearTimeout(uploadTooltipTimeoutRef.current);
      }
      if (toggleTooltipTimeoutRef.current) {
        globalThis.clearTimeout(toggleTooltipTimeoutRef.current);
      }
    };
  }, []);

  const bodyTools = "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
  const titlePurpleLDCenter =
    "inline-block w-full mobileMd:-mb-3 mobileLg:mb-0 text-3xl mobileMd:text-4xl mobileLg:text-5xl font-black purple-gradient3 text-center";
  const feeSelectorContainer =
    "p-3 mobileMd:p-6 dark-gradient rounded-lg z-[10] w-full";
  const tooltipButton =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm mb-1 bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap transition-opacity duration-300";
  const tooltipImage =
    "fixed bg-[#000000BF] px-2 py-1 mb-1 rounded-sm text-[10px] mobileLg:text-xs text-stamp-grey-light whitespace-nowrap pointer-events-none z-50 transition-opacity duration-300";

  return (
    <div className={bodyTools}>
      <h1 className={titlePurpleLDCenter}>DEPLOY</h1>

      <div className="dark-gradient rounded-lg p-3 mobileMd:p-6 w-full">
        <div className="flex gap-3 mobileMd:gap-6">
          <div className="flex flex-col gap-3 mobileMd:gap-6 !w-[108px] mobileMd:!w-[120px]">
            <div
              id="image-preview"
              class="relative rounded items-center text-center cursor-pointer min-w-[96px] h-[96px] mobileMd:min-w-[108px] mobileMd:h-[108px] mobileLg:min-w-[120px] mobileLg:h-[120px] content-center bg-stamp-purple-dark group hover:bg-[#8800CC] transition duration-300"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleUploadMouseEnter}
              onMouseLeave={handleUploadMouseLeave}
              onMouseDown={() => setIsUploadTooltipVisible(false)}
              onClick={() => setIsUploadTooltipVisible(false)}
            >
              <input
                id="upload"
                type="file"
                class="hidden"
                accept="image/*"
                onChange={handleFileChange}
              />
              {formState.file !== null && (
                <img
                  width={324}
                  style={{
                    height: "100%",
                    objectFit: "contain",
                    imageRendering: "pixelated",
                    backgroundColor: "rgb(0,0,0)",
                    borderRadius: "6px",
                  }}
                  src={URL.createObjectURL(formState.file)}
                />
              )}
              {formState.file === null && (
                <label
                  for="upload"
                  class="cursor-pointer h-full flex flex-col items-center justify-center gap-3"
                >
                  <img
                    src="/img/stamping/image-upload.svg"
                    class="w-7 h-7 mobileMd:w-8 mobileMd:h-8 mobileLg:w-9 mobileLg:h-9"
                    alt=""
                  />
                  <div
                    class={`${tooltipImage} ${
                      isUploadTooltipVisible ? "opacity-100" : "opacity-0"
                    }`}
                    style={{
                      left: `${tooltipPosition.x}px`,
                      top: `${tooltipPosition.y - 6}px`,
                      transform: "translate(-50%, -100%)",
                    }}
                  >
                    UPLOAD COVER IMAGE
                  </div>
                </label>
              )}
            </div>

            <SRC20InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Decimal amount"
              value={formState.dec}
              onChange={(e) => handleInputChange(e, "dec")}
            />
          </div>

          <div className="flex flex-col gap-3 mobileMd:gap-6 w-full">
            <div class="w-full flex gap-3 mobileMd:gap-6">
              <SRC20InputField
                type="text"
                placeholder="Ticker name"
                value={formState.token}
                onChange={(e) => {
                  const newValue = (e.target as HTMLInputElement).value
                    .toUpperCase();
                  if (newValue !== formState.token) {
                    handleInputChange(e, "token");
                  }
                }}
                onBlur={() => handleInputBlur("token")}
                error={formState.tokenError}
                maxLength={5}
                isUppercase
              />
              <button
                class="min-w-[42px] h-[21px] mobileLg:min-w-12 mobileLg:h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow relative"
                onClick={() => {
                  handleShowAdvancedOptions();
                  setIsToggleTooltipVisible(false);
                  setAllowTooltip(false);
                }}
                onMouseEnter={handleToggleMouseEnter}
                onMouseLeave={handleToggleMouseLeave}
              >
                <div
                  id="switch-toggle-advanced"
                  class="w-[21px] h-[21px] mobileLg:w-6 mobileLg:h-6 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey"
                >
                </div>
                <div
                  className={`${tooltipButton} ${
                    isToggleTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {tooltipText}
                </div>
              </button>
            </div>

            <SRC20InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Limit per mint"
              value={formState.lim}
              onChange={(e) => handleInputChange(e, "lim")}
              onBlur={() => handleInputBlur("lim")}
              error={formState.limError}
            />

            <SRC20InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Supply"
              value={formState.max}
              onChange={(e) => handleInputChange(e, "max")}
              onBlur={() => handleInputBlur("max")}
              error={formState.maxError}
            />
          </div>
        </div>

        <div
          className={`overflow-hidden transition-all duration-500 ${
            showAdvancedOptions
              ? "max-h-[400px] opacity-100 mt-3 mobileMd:mt-6"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className="flex flex-col gap-3 mobileMd:gap-6">
            <textarea
              type="text"
              class="h-[96px] mobileMd:h-[108px] mobileLg:h-[120px] p-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-[#CCCCCC]"
              placeholder="Description"
              rows={5}
            />
            <div className="w-full flex gap-3 mobileMd:gap-6">
              <SRC20InputField
                type="text"
                placeholder="X"
                value={formState.x}
                onChange={(e) => handleInputChange(e, "x")}
              />
              <SRC20InputField
                type="text"
                placeholder="Website"
                value={formState.web}
                onChange={(e) => handleInputChange(e, "web")}
              />
            </div>
            <div className="w-full flex gap-3 mobileMd:gap-6">
              <SRC20InputField
                type="text"
                placeholder="Telegram"
                value={formState.tg || ""}
                onChange={(e) => handleInputChange(e, "telegram")}
              />
              <SRC20InputField
                type="email"
                placeholder="Email"
                value={formState.email || ""}
                onChange={(e) => handleInputChange(e, "email")}
              />
            </div>
          </div>
        </div>
      </div>

      <div className={feeSelectorContainer}>
        <ComplexFeeCalculator
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          fileSize={undefined}
          issuance={undefined}
          serviceFee={undefined}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitWithUpload}
          buttonName={isConnected ? "DEPLOY" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          userAddress={wallet?.address}
          disabled={undefined}
          effectiveFeeRate={undefined}
          utxoAncestors={undefined}
          feeDetails={{
            minerFee: formState.psbtFees?.estMinerFee || 0,
            dustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: true,
            totalValue: formState.psbtFees?.totalValue || 0,
            estimatedSize: formState.psbtFees?.est_tx_size || 0,
          }}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          fileUploadError={fileUploadError}
        />
      </div>
    </div>
  );
}
