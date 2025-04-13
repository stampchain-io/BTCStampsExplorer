/* ===== SRC20 TOKEN DEPLOYMENT COMPONENT ===== */
import axiod from "axiod";
import { useEffect, useRef, useState } from "preact/hooks";
import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { logger } from "$lib/utils/logger.ts";
import { getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";
import { APIResponse } from "$lib/utils/apiResponseUtil.ts";
import { BasicFeeCalculator } from "$components/shared/fee/BasicFeeCalculator.tsx";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  containerRowForm,
} from "$layout";
import { Icon } from "$icon";
import { inputTextarea, SRC20InputField } from "$form";
import { titlePurpleLD } from "$text";
import { ToggleSwitchButton } from "$button";
import { StatusMessages, tooltipButton, tooltipImage } from "$notification";

/* ===== INTERFACE DEFINITIONS ===== */
interface UploadResponse extends APIResponse {
  url?: string;
}

/* ===== COMPONENT IMPLEMENTATION ===== */
export function SRC20DeployTool(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" } = { trxType: "olga" },
) {
  console.log("SRC20DeployTool trxType:", trxType);
  /* ===== FORM HOOK AND STATE ===== */
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

  /* ===== LOCAL STATE ===== */
  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isUploadTooltipVisible, setIsUploadTooltipVisible] = useState(false);
  const [isToggleTooltipVisible, setIsToggleTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const uploadTooltipTimeoutRef = useRef<number | null>(null);
  const toggleTooltipTimeoutRef = useRef<number | null>(null);
  const [tooltipText, setTooltipText] = useState("OPTIONAL FIELDS");
  const { wallet, isConnected } = walletContext;

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  /* ===== FILE HANDLING ===== */
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

  /* ===== FILE UPLOAD HANDLER ===== */
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
          // `File upload failed: ${errorMessage}. The deployment will continue without the background image.`,
          `File upload failed: The deployment will continue without the background image.`,
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

  /* ===== SUBMIT HANDLER ===== */
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

  /* ===== ADANCED OPTIONS TOGGLE ===== */
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const handleShowAdvancedOptions = () => {
    setAllowTooltip(false);
    setIsToggleTooltipVisible(false);
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  /* ===== TOOLTIP HANDLERS ===== */
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
      setTooltipText(
        showAdvancedOptions ? "REQUIRED FIELDS" : "OPTIONAL FIELDS",
      );

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

  /* ===== CLEANUP EFFECT ===== */
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

  /* ===== COMPONENT RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>DEPLOY</h1>

      <form
        class={`${containerBackground} mb-6`}
        onSubmit={(e) => {
          e.preventDefault();
          handleSubmitWithUpload();
        }}
        aria-label="Deploy SRC20 token"
        novalidate
      >
        {/* ===== MAIN FORM CONTAINER ===== */}
        <div className={containerRowForm}>
          {/* Image upload and decimals section */}
          <div className={`${containerColForm} !w-[100px]`}>
            {/* Image upload preview */}
            <div
              id="image-preview"
              class="relative flex flex-col items-center justify-center content-center mx-auto min-h-[100px] min-w-[100px] rounded bg-stamp-purple-dark hover:bg-stamp-purple transition duration-300 cursor-pointer"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleUploadMouseEnter}
              onMouseLeave={handleUploadMouseLeave}
              onMouseDown={() => setIsUploadTooltipVisible(false)}
              onClick={() => setIsUploadTooltipVisible(false)}
            >
              {/* File input and preview logic */}
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
                  class="bg-conic-pattern bg-[length:4px_4px]"
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
                  class="cursor-pointer bg-conic-pattern bg-[length:4px_4px] h-full flex flex-col items-center justify-center gap-3"
                >
                  <Icon
                    type="icon"
                    name="upload"
                    weight="normal"
                    size="xxl"
                    color="grey"
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

            {/* Decimal input */}
            <SRC20InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Decimals"
              value={formState.dec}
              onChange={(e) => handleInputChange(e, "dec")}
            />
          </div>

          {/* Token details section */}
          <div className={containerColForm}>
            <div class={containerRowForm}>
              {/* Token input */}
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
              {/* Advanced options toggle */}
              <div className="relative" tabIndex={0}>
                <ToggleSwitchButton
                  isActive={showAdvancedOptions}
                  onToggle={() => {
                    handleShowAdvancedOptions();
                    setIsToggleTooltipVisible(false);
                    setAllowTooltip(false);
                  }}
                  toggleButtonId="switch-toggle-advanced"
                  onMouseEnter={handleToggleMouseEnter}
                  onMouseLeave={handleToggleMouseLeave}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                />
                <div
                  className={`${tooltipButton} ${
                    isToggleTooltipVisible ? "opacity-100" : "opacity-0"
                  }`}
                >
                  {tooltipText}
                </div>
              </div>
            </div>

            {/* Limit and supply inputs */}
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

        {/* ===== ADVANCED OPTIONS SECTION ===== */}
        <div
          className={`overflow-hidden transition-all duration-500 ${
            showAdvancedOptions
              ? "max-h-[250px] opacity-100 mt-5"
              : "max-h-0 opacity-0 mt-0"
          }`}
        >
          <div className={containerColForm}>
            <textarea
              type="text"
              class={`${inputTextarea} scrollbar-grey`}
              placeholder="Description"
              rows={3}
            />
            <div className={containerRowForm}>
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
            <div className={containerRowForm}>
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
      </form>

      {/* ===== FEE CALCULATOR AND STATUS MESSAGES ===== */}
      <div className={containerBackground}>
        <BasicFeeCalculator
          fee={formState.fee}
          ticker={formState.token}
          limit={formState.lim}
          supply={formState.max}
          fromPage="src20_deploy"
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          fileSize={0}
          issuance={0}
          serviceFee={0}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmitWithUpload}
          buttonName={isConnected ? "DEPLOY" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          userAddress={wallet?.address ?? ""}
          disabled={false}
          effectiveFeeRate={0}
          utxoAncestors={[]}
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
