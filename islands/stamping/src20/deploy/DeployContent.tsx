import { useEffect, useState } from "preact/hooks";
import { FeeEstimation } from "../../FeeEstimation.tsx";
import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";
import axiod from "axiod";

export function DeployContent(
  { trxType = "multisig" }: { trxType?: "olga" | "multisig" },
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

  const handleFileUpload = async (file: File) => {
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
      <p class="bg-clip-text text-transparent bg-gradient-to-r from-[#440066] via-[#660099] to-[#8800CC] text-3xl md:text-6xl font-black mt-6 w-full text-center">
        DEPLOY
      </p>

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6 w-full flex flex-col gap-6">
        <div className="flex gap-6">
          <div className="flex flex-col gap-6">
            <div
              id="image-preview"
              class="relative max-w-sm rounded-[3px] items-center mx-auto text-center cursor-pointer min-w-[120px] h-[120px] content-center bg-[#660099]"
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
                    src="/img/mint/icon-image-upload.png"
                    class="w-16 h-16"
                    alt=""
                  />
                </label>
              )}
            </div>

            <div class="w-full">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Decimal amount"
                value={formState.dec}
                onChange={(e) => handleInputChange(e, "dec")}
              />
            </div>
          </div>

          <div className="flex flex-col gap-6 w-full">
            <div class="w-full flex gap-6">
              <input
                type="text"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Token ticker name"
                value={formState.token}
                onChange={(e) => handleInputChange(e, "token")}
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
              {formState.tokenError && (
                <p class="text-red-500 mt-2">{formState.tokenError}</p>
              )}
            </div>

            <div class="w-full">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Limit pr. mint"
                value={formState.lim}
                onChange={(e) => handleInputChange(e, "lim")}
              />
              {formState.limError && (
                <p class="text-red-500 mt-2">{formState.limError}</p>
              )}
            </div>

            <div class="w-full">
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]*"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Supply"
                value={formState.max}
                onChange={(e) => handleInputChange(e, "max")}
              />
              {formState.maxError && (
                <p class="text-red-500 mt-2">{formState.maxError}</p>
              )}
            </div>
          </div>
        </div>

        {showAdvancedOptions && (
          <div
            className={`flex flex-col gap-6 transition-all duration-300 ${
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
            <div className="w-full flex gap-6">
              <input
                type="text"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="X"
                value={formState.x}
                onChange={(e) => handleInputChange(e, "x")}
              />
              <input
                type="text"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Website"
                value={formState.web}
                onChange={(e) => handleInputChange(e, "web")}
              />
            </div>
            <div className="w-full flex gap-6">
              <input
                type="email"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Telegram"
                // value={formState.telegram}
                // onChange={(e) => handleInputChange(e, "telegram")}
              />
              <input
                type="email"
                class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
                placeholder="Email"
                value={formState.email}
                onChange={(e) => handleInputChange(e, "email")}
              />
            </div>
          </div>
        )}
      </div>

      <div className="bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full">
        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="src20-deploy"
          fileType="application/json"
          fileSize={formState.jsonSize}
          issuance={1}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
          isSubmitting={isSubmitting}
          onSubmit={handleDeploySubmit}
          buttonName="Deploy"
        />

        {submissionMessage && (
          <div class="w-full text-center text-white mt-4">
            <p>{submissionMessage.message}</p>
            {submissionMessage.txid && (
              <div
                class="overflow-x-auto"
                style={{ maxWidth: "100%" }}
              >
                <span>TXID:&nbsp;</span>
                <a
                  href={`https://mempool.space/tx/${submissionMessage.txid}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  class="text-blue-500 underline whitespace-nowrap"
                >
                  {submissionMessage.txid}
                </a>
              </div>
            )}
          </div>
        )}

        {apiError && (
          <div class="w-full text-red-500 text-center mt-4">
            {apiError}
          </div>
        )}

        {fileUploadError && (
          <div class="w-full text-yellow-500 text-center mt-4">
            {fileUploadError}
          </div>
        )}

        {walletError && (
          <div class="w-full text-red-500 text-center mt-4">
            {walletError}
          </div>
        )}
      </div>
    </div>
  );
}
