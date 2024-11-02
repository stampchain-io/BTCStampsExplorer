import axiod from "axiod";
import { useEffect, useState } from "preact/hooks";

import { useSRC20Form } from "$client/hooks/useSRC20Form.ts";

import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { StatusMessages } from "$islands/stamping/StatusMessages.tsx";
import { InputField } from "$islands/stamping/InputField.tsx";

export function DeployContent(
  { trxType = "olga" }: { trxType?: "olga" | "multisig" },
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
  } = useSRC20Form("deploy", trxType);

  const [fileUploadError, setFileUploadError] = useState<string | null>(null);

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

  const handleFileUpload = (file: File) => {
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = async () => {
      const base64String = reader.result as string;

      try {
        const response = await axiod.post(`/api/v2/upload-src20-background`, {
          fileData: base64String,
          tick: formState.token,
        });

        if (response.data.success) {
          console.log("File uploaded successfully");
        } else {
          throw new Error(response.data.message || "Upload failed");
        }
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
      // Proceed with the main deploy process regardless of file upload result
      await handleSubmit({ fileUploaded });
    } catch (error) {
      console.error("Deployment error:", error);
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
          `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
      }, 150);
    } else {
      switchToggle.classList.remove("translate-x-full");
      setTimeout(() => {
        switchToggle.innerHTML =
          `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
      }, 150);
    }
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  useEffect(() => {
    const advancedToggle = document.getElementById("switch-toggle-advanced");
    if (advancedToggle) {
      advancedToggle.innerHTML =
        `<div class='w-5 h-5 rounded-full bg-[#440066]'></div>`;
    }
  }, []);

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="purple-gradient1 text-3xl tablet:text-6xl font-black mt-6 w-full text-center">
        DEPLOY
      </p>

      <div className="dark-gradient p-2 tablet:p-6 w-full flex flex-col gap-3 tablet:gap-6">
        <div className="flex gap-3 tablet:gap-6">
          <div className="flex flex-col gap-3 tablet:gap-6 !w-[108px] tablet:!w-[120px]">
            <div
              id="image-preview"
              class="relative rounded-[3px] items-center text-center cursor-pointer min-w-[108px] tablet:min-w-[120px] h-[108px] tablet:h-[120px] content-center bg-[#660099]"
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

            <InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Decimal amount"
              value={formState.dec}
              onChange={(e) => handleInputChange(e, "dec")}
            />
          </div>

          <div className="flex flex-col gap-3 tablet:gap-6 w-full">
            <div class="w-full flex gap-3 tablet:gap-6">
              <InputField
                type="text"
                placeholder="Token ticker name"
                value={formState.token}
                onChange={(e) => handleInputChange(e, "token")}
                error={formState.tokenError}
                maxLength={5}
              />
              <button
                class="min-w-12 h-6 rounded-full bg-gray-700 flex items-center transition duration-300 focus:outline-none shadow"
                onClick={handleShowAdvancedOptions}
              >
                <div
                  id="switch-toggle-advanced"
                  class="w-6 h-6 relative rounded-full transition duration-500 transform text-white flex justify-center items-center"
                >
                </div>
              </button>
            </div>

            <InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Limit pr. mint"
              value={formState.lim}
              onChange={(e) => handleInputChange(e, "lim")}
              error={formState.limError}
            />

            <InputField
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="Supply"
              value={formState.max}
              onChange={(e) => handleInputChange(e, "max")}
              error={formState.maxError}
            />
          </div>
        </div>

        <div
          className={`flex flex-col gap-3 tablet:gap-6 transition-all duration-300 ${
            showAdvancedOptions ? "h-full opacity-100" : "h-0 opacity-0"
          }`}
        >
          <textarea
            type="text"
            class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
            placeholder="Description"
            rows={5}
            // value={formState.description}
            // onChange={(e) => handleInputChange(e, "description")}
          />
          <div className="w-full flex gap-3 tablet:gap-6">
            <InputField
              type="text"
              placeholder="X"
              value={formState.x}
              onChange={(e) => handleInputChange(e, "x")}
            />
            <InputField
              type="text"
              placeholder="Website"
              value={formState.web}
              onChange={(e) => handleInputChange(e, "web")}
            />
          </div>
          <div className="w-full flex gap-3 tablet:gap-6">
            <InputField
              type="text"
              placeholder="Telegram"
              value=""
              // value={formState.telegram}
              onChange={(e) => handleInputChange(e, "telegram")}
            />
            <InputField
              type="email"
              placeholder="Email"
              value={formState.email}
              onChange={(e) => handleInputChange(e, "email")}
            />
          </div>
        </div>
      </div>

      <div className="dark-gradient p-3 tablet:p-6 w-full z-[10]">
        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20"
          fileType="application/json"
          fileSize={formState.jsonSize}
          inputType={trxType === "olga" ? "P2WSH" : "P2SH"}
          outputTypes={trxType === "olga" ? ["P2WSH"] : ["P2SH", "P2WSH"]}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleDeploySubmit}
          buttonName="Deploy"
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
