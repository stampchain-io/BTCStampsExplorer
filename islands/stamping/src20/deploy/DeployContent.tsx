import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";
import { walletContext } from "$client/wallet/wallet.ts";

import { ComplexFeeCalculator } from "$islands/fee/ComplexFeeCalculator.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { SRC20InputField } from "../SRC20InputField.tsx";
import { logger } from "$lib/utils/logger.ts";
import { getCSRFToken } from "$lib/utils/clientSecurityUtils.ts";

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
    isLoading,
    config,
    isSubmitting,
    submissionMessage,
    walletError,
    apiError,
    setApiError,
    handleInputBlur,
  } = useSRC20Form("deploy", trxType);

  const [fileUploadError, setFileUploadError] = useState<string | null>(null);
  const [tosAgreed, setTosAgreed] = useState(false);

  const { wallet, isConnected } = walletContext;

  if (isLoading) {
    return <div>Loading...</div>;
  }

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

  const handleFileUpload = async (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        const csrfToken = await getCSRFToken();

        const response = await axiod.post("/api/internal/src20Background", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-CSRF-Token": csrfToken,
          },
          body: JSON.stringify({
            fileData: base64String,
            tick: formState.token,
            csrfToken,
          }),
        });

        if (!response.data.success) {
          throw new Error(response.data.message || "Upload failed");
        }
        console.log("File uploaded successfully");
      } catch (error) {
        console.error("Error uploading file:", error);
        setFileUploadError(
          "File upload failed. The deployment will continue without the background image.",
        );
      }
    };

    reader.readAsDataURL(file);
  };

  const handleDeploySubmit = async () => {
    if (!isConnected) {
      logger.debug("stamps", {
        message: "Showing wallet connect modal - user not connected",
      });
      walletContext.showConnectModal();
      return;
    }

    let fileUploaded = false;
    if (formState.file) {
      try {
        await handleFileUpload(formState.file);
        fileUploaded = true;
      } catch (error) {
        console.error("File upload failed:", error);
        setFileUploadError(
          "File upload failed. The deployment will continue without the background image.",
        );
      }
    }

    try {
      const result = await handleSubmit({
        fileUploaded,
        trxType: trxType || "multisig",
      });

      if (!result?.hex) {
        throw new Error("No transaction hex received from server");
      }

      logger.debug("stamps", {
        message: "PSBT received from server",
        hex: result.hex.substring(0, 100) + "...",
      });
    } catch (error) {
      console.error("Deployment error:", error);
      setApiError(
        error instanceof Error ? error.message : "Unknown error occurred",
      );
    }
  };

  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const handleShowAdvancedOptions = () => {
    const switchToggle = document.querySelector("#switch-toggle-advanced");
    if (!switchToggle) return;
    if (showAdvancedOptions !== true) {
      switchToggle.classList.add("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-stamp-purple-dark'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-stamp-purple-darker'></div>`;
      }, 150);
    }
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  useEffect(() => {
    const advancedToggle = document.getElementById("switch-toggle-advanced");
    if (advancedToggle) {
      advancedToggle.innerHTML =
        `<div class='w-5 h-5 rounded-full bg-stamp-purple-darker'></div>`;
    }
  }, []);

  const bodyToolsClassName =
    "flex flex-col w-full items-center gap-3 mobileMd:gap-6";
  const titlePurpleLDCenterClassName =
    "inline-block text-3xl mobileMd:text-4xl mobileLg:text-5xl desktop:text-6xl font-black purple-gradient3 w-full text-center";
  const feeSelectorContainerClassName =
    "p-3 mobileMd:p-6 dark-gradient z-[10] w-full";

  return (
    <div className={bodyToolsClassName}>
      <h1 className={titlePurpleLDCenterClassName}>DEPLOY</h1>

      <div className="dark-gradient p-2 mobileMd:p-6 w-full">
        <div className="flex gap-3 mobileMd:gap-6">
          <div className="flex flex-col gap-3 mobileMd:gap-6 !w-[108px] mobileMd:!w-[120px]">
            <div
              id="image-preview"
              class="relative rounded-[3px] items-center text-center cursor-pointer min-w-[108px] mobileMd:min-w-[120px] h-[108px] mobileMd:h-[120px] content-center bg-stamp-purple-darker"
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
                    class="w-12 h-12"
                    alt=""
                  />
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
                placeholder="Token ticker name"
                value={formState.token}
                onChange={(e) => handleInputChange(e, "token")}
                onBlur={() => handleInputBlur("token")}
                error={formState.tokenError}
                maxLength={5}
                isUppercase
              />
              <button
                class="min-w-12 h-6 rounded-full bg-stamp-grey flex items-center transition duration-300 focus:outline-none shadow"
                onClick={handleShowAdvancedOptions}
              >
                <div
                  id="switch-toggle-advanced"
                  class="w-6 h-6 relative rounded-full transition duration-500 transform flex justify-center items-center bg-stamp-grey"
                >
                </div>
              </button>
            </div>

            <SRC20InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Limit pr. mint"
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
              class="h-[108px] mobileMd:h-[120px] p-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-[#CCCCCC]"
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

      <div className={feeSelectorContainerClassName}>
        <ComplexFeeCalculator
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleDeploySubmit}
          buttonName={isConnected ? "DEPLOY" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          userAddress={wallet?.address}
          utxoAncestors={formState.utxoAncestors}
          feeDetails={{
            minerFee: formState.psbtFees?.estMinerFee || 0,
            dustValue: formState.psbtFees?.totalDustValue || 0,
            hasExactFees: !!formState.psbtFees?.hasExactFees,
          }}
        />

        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
          fileUploadError={fileUploadError}
          walletError={walletError}
        />
      </div>
    </div>
  );
}
