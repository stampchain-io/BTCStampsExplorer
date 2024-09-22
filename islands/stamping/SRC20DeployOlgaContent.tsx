import { useState } from "preact/hooks";
import { FeeEstimation } from "$islands/stamping/FeeEstimation.tsx";
import { useSRC20Form } from "$islands/hooks/useSRC20Form.ts";

export function SRC20DeployContent() {
  console.log("Rendering SRC20DeployContent");

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
  } = useSRC20Form("deploy", "olga");

  const [deploymentError, setDeploymentError] = useState<string | null>(null);

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (!config) {
    return <div>Error: Failed to load configuration</div>;
  }

  const handleSRC20DeploySubmit = async () => {
    setDeploymentError(null);
    try {
      console.log("Starting SRC20 deployment");
      console.log("Current form state:", {
        token: formState.token,
        max: formState.max,
        lim: formState.lim,
        dec: formState.dec,
        fee: formState.fee,
      });
      const result = await handleSubmit();
      console.log("Deployment result:", result);
      // Handle successful deployment here
    } catch (error) {
      console.error("Deployment error:", error);
      setDeploymentError(
        error.message || "An unexpected error occurred during deployment",
      );
    }
  };

  // Wrapper function for handleInputChange to add logging
  const handleInputChangeWithLogging = (e: Event, field: string) => {
    const value = (e.target as HTMLInputElement).value;
    console.log(`Updating ${field} with value:`, value);
    handleInputChange(e, field);
    // Log the updated form state after the change
    console.log("Updated form state:", formState);
  };

  return (
    <div class="flex flex-col w-full items-center gap-8">
      <p class="text-[#5503A6] text-3xl md:text-6xl font-black mt-6 w-full text-center">
        DEPLOY SRC-20
      </p>

      <div
        className={"flex flex-col md:flex-row gap-6 bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-2 md:p-6 w-full"}
      >
        <div className={"flex flex-col gap-6 w-full"}>
          <div class="w-full">
            <input
              type="text"
              class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
              placeholder="Token ticker name"
              value={formState.token}
              onChange={(e) => handleInputChangeWithLogging(e, "token")}
              maxLength={5}
            />
            {formState.tokenError && (
              <p class="text-red-500 mt-2">{formState.tokenError}</p>
            )}
          </div>

          <div class="w-full">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
              placeholder="Limit Per Mint (Positive Integer, max uint64)"
              value={formState.lim}
              onChange={(e) => handleInputChangeWithLogging(e, "lim")}
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
              class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
              placeholder="Max Circulation (Positive Integer, max uint64)"
              value={formState.max}
              onChange={(e) => handleInputChangeWithLogging(e, "max")}
            />
            {formState.maxError && (
              <p class="text-red-500 mt-2">{formState.maxError}</p>
            )}
          </div>

          <div class="w-full">
            <input
              type="text"
              inputMode="numeric"
              pattern="[0-9]*"
              class="p-4 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md"
              placeholder="Decimal Places (0-18, default: 18)"
              value={formState.dec}
              onChange={(e) => handleInputChangeWithLogging(e, "dec")}
            />
          </div>
        </div>
      </div>

      <div
        className={"bg-gradient-to-br from-[#1F002E00] via-[#14001F7F] to-[#1F002EFF] p-6 w-full"}
      >
        <FeeEstimation
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="deploy"
          fileType="application/json"
          fileSize={formState.jsonSize}
          issuance={1}
          BTCPrice={formState.BTCPrice}
          onRefresh={fetchFees}
        />

        {apiError && (
          <div class="w-full text-red-500 text-center">
            API Error: {apiError}
          </div>
        )}

        {deploymentError && (
          <div class="w-full text-red-500 text-center">
            Deployment Error: {deploymentError}
          </div>
        )}

        {submissionMessage && (
          <div class="w-full text-center font-bold">
            {submissionMessage}
          </div>
        )}

        {walletError && (
          <div class="w-full text-red-500 text-center">
            Wallet Error: {walletError}
          </div>
        )}

        <div
          class={`w-full text-white text-center font-bold border-[0.5px] border-[#8A8989] rounded-md mt-4 py-6 px-4 ${
            isSubmitting
              ? "bg-gray-500 cursor-not-allowed"
              : "bg-[#5503A6] cursor-pointer"
          }`}
          onClick={() => {
            console.log("Deploy button clicked");
            if (!isSubmitting) {
              handleSRC20DeploySubmit();
            }
          }}
        >
          {isSubmitting ? "Deploying..." : "Deploy SRC-20 Token"}
        </div>
      </div>
    </div>
  );
}
