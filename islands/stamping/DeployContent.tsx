import { useState } from "preact/hooks";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";
import axiod from "axiod";

export function DeployContent() {
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
  } = useSRC20Form("deploy");

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

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="text-[#5503A6] text-[43px] font-medium mt-6 w-full text-left">
        DEPLOY SRC-20
      </p>

      <div>
        <div class="flex flex-col md:flex-row gap-8">
          <div
            id="image-preview"
            class="relative max-w-sm border border-[#F5F5F5] rounded-md items-center mx-auto text-center cursor-pointer w-[324px] h-[324px] content-center bg-[#2B0E49]"
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
                  class="w-20 h-20"
                  alt=""
                />
                <h5 class="text-[#F5F5F5] text-2xl font-semibold">
                  Upload Image
                </h5>
              </label>
            )}
          </div>
        </div>
      </div>

      <div class="w-full flex flex-col md:flex-row gap-8 md:gap-5">
        <div class="w-full">
          <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
            Token
          </p>
          <input
            type="text"
            class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
            placeholder="Max 5 Chars"
            value={formState.token}
            onChange={(e) => handleInputChange(e, "token")}
            maxLength={5}
          />
          {formState.tokenError && (
            <p class="text-red-500 mt-2">{formState.tokenError}</p>
          )}
        </div>
        <div class="w-full">
          <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
            Limit Per Mint
          </p>
          <input
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
            placeholder="Positive Integer (max uint64)"
            value={formState.lim}
            onChange={(e) => handleInputChange(e, "lim")}
          />
          {formState.limError && (
            <p class="text-red-500 mt-2">{formState.limError}</p>
          )}
        </div>
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">
          Max Circulation
        </p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Positive Integer (max uint64)"
          value={formState.max}
          onChange={(e) => handleInputChange(e, "max")}
        />
        {formState.maxError && (
          <p class="text-red-500 mt-2">{formState.maxError}</p>
        )}
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">Decimal Places</p>
        <input
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Decimal Places (0-18, default: 18)"
          value={formState.dec}
          onChange={(e) => handleInputChange(e, "dec")}
        />
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">X Username</p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="X Username (optional)"
          value={formState.x}
          onChange={(e) => handleInputChange(e, "x")}
        />
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">Website</p>
        <input
          type="text"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Website (optional)"
          value={formState.web}
          onChange={(e) => handleInputChange(e, "web")}
        />
      </div>

      <div class="w-full">
        <p class="text-lg font-semibold text-[#F5F5F5] mb-3">Email</p>
        <input
          type="email"
          class="px-3 py-6 bg-[#6E6E6E] text-sm text-[#F5F5F5] w-full"
          placeholder="Email (optional)"
          value={formState.email}
          onChange={(e) => handleInputChange(e, "email")}
        />
      </div>

      <FeeEstimation
        fee={formState.fee}
        handleChangeFee={handleChangeFee}
        type="src20-deploy"
        fileType="application/json"
        fileSize={formState.jsonSize}
        issuance={1}
        BTCPrice={formState.BTCPrice}
        onRefresh={fetchFees}
      />

      {apiError && (
        <div class="w-full text-red-500 text-center">
          {apiError}
        </div>
      )}

      {fileUploadError && (
        <div class="w-full text-yellow-500 text-center">
          {fileUploadError}
        </div>
      )}

      {submissionMessage && (
        <div class="w-full text-center font-bold">
          {submissionMessage}
        </div>
      )}

      {walletError && (
        <div class="w-full text-red-500 text-center">
          {walletError}
        </div>
      )}

      <div
        class={`w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 ${
          isSubmitting
            ? "bg-gray-500 cursor-not-allowed"
            : "bg-[#5503A6] cursor-pointer"
        }`}
        onClick={isSubmitting ? undefined : handleDeploySubmit}
      >
        {isSubmitting ? "Stamping..." : "Stamp Now"}
      </div>
    </div>
  );
}
