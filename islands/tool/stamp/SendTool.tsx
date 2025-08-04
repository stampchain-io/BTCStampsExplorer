/* ===== SEND TOOL COMPONENT ===== */
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { inputField, inputFieldSquare } from "$form";
import type { StampRow } from "$types/stamp.d.ts";
import { Icon } from "$icon";
import { SelectField } from "$islands/form/SelectField.tsx";
import {
  bodyTool,
  containerBackground,
  containerColForm,
  containerRowForm,
  imagePreviewTool,
  loaderSpinGrey,
  rowForm,
} from "$layout";
import { useTransactionConstructionService } from "$lib/hooks/useTransactionConstructionService.ts";
import { FeeCalculatorBase } from "$section";
import { titlePurpleLD } from "$text";
import { JSX } from "preact";
import { useEffect, useMemo, useState } from "preact/hooks";

/* ===== COMPONENT ===== */
export function StampSendTool() {
  console.log("SENDTOOL: Component rendering - TOP LEVEL");

  /* ===== CONTEXT ===== */
  const { wallet } = walletContext;

  /* ===== STATE ===== */
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [quantity, setQuantity] = useState(1);
  const [selectedStamp, setSelectedStamp] = useState<StampRow | null>(null);
  const [stamps, setStamps] = useState<{
    data: StampRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  }>({
    data: [],
    pagination: {
      page: 1,
      limit: 10,
      total: 0,
      totalPages: 0,
    },
  });
  const [tosAgreed, setTosAgreed] = useState<boolean>(false);
  const [isImageLoading, setIsImageLoading] = useState(true);
  const [showFallbackIcon, setShowFallbackIcon] = useState(false);

  /* ===== FORM HANDLING ===== */
  const {
    formState,
    setFormState,
    handleChangeFee: internalHandleChangeFee,
    handleSubmit,
    isSubmitting,
    error,
    setError,
    successMessage,
    setSuccessMessage,
  } = useTransactionForm({
    type: "transfer",
    initialFee: 1,
  });

  /* ===== 🚀 PROGRESSIVE FEE ESTIMATION INTEGRATION ===== */
  const {
    getBestEstimate,
    isPreFetching,
    estimateExact, // Phase 3: Exact estimation before sending
    // Phase-specific results for UI indicators
    phase1,
    phase2,
    phase3,
    currentPhase,
    error: feeEstimationError,
    clearError,
  } = useTransactionConstructionService({
    toolType: "stamp",
    feeRate: isSubmitting ? 0 : formState.fee,
    walletAddress: wallet?.address || "", // Provide empty string instead of undefined
    isConnected: !!wallet && !isSubmitting,
    isSubmitting,
    // Stamp send specific parameters
    asset: selectedStamp?.cpid || "",
    transferQuantity: quantity,
    recipientAddress: formState.recipientAddress || "",
  });

  // Get the best available fee estimate
  const progressiveFeeDetails = getBestEstimate();

  // Local state for exact fee details (updated when Phase 3 completes) - StampingTool pattern
  const [exactFeeDetails, setExactFeeDetails] = useState<
    typeof progressiveFeeDetails | null
  >(null);

  // Reset exactFeeDetails when fee rate changes to allow slider updates - StampingTool pattern
  useEffect(() => {
    // Clear exact fee details when fee rate changes so slider updates work
    setExactFeeDetails(null);
  }, [formState.fee]);

  // Wrapper function for sending that gets exact fees first - StampingTool pattern
  const handleSendWithExactFees = async () => {
    try {
      // Get exact fees before final submission
      const exactFees = await estimateExact();
      if (exactFees) {
        // Calculate net spend amount (matches wallet display)
        const netSpendAmount = exactFees.totalValue || 0;
        setExactFeeDetails({
          ...exactFees,
          totalValue: netSpendAmount, // Matches wallet
        });
      }

      // Call the original transfer submission
      await handleTransferSubmit();
    } catch (error) {
      console.error("SENDTOOL: Error in exact fee estimation", error);
      // Still proceed with submission even if exact fees fail
      await handleTransferSubmit();
    }
  };

  /* ===== EFFECTS ===== */
  // Fetch stamps effect
  useEffect(() => {
    const fetchStamps = async () => {
      try {
        if (!wallet?.address) return;

        const endpoint = `/api/v2/stamps/balance/${wallet.address}`;
        const response = await fetch(endpoint);

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to fetch stamps: ${errorText}`);
        }

        const data = await response.json();
        setStamps({
          data: data.data || [],
          pagination: {
            page: 1,
            limit: 10,
            total: data.total || 0,
            totalPages: Math.ceil((data.total || 0) / 10),
          },
        });
      } catch (error) {
        if (error instanceof Error) {
          setError(error.message);
        } else {
          setError(String(error));
        }
      }
    };

    if (wallet?.address) {
      fetchStamps();
    }
  }, [wallet?.address]);

  // Set initial stamp effect
  useEffect(() => {
    if (stamps.data.length > 0 && !selectedStamp) {
      const firstStamp = stamps.data[0];
      setSelectedStamp(firstStamp);
      setFormState((prev) => ({
        ...prev,
        stampId: firstStamp.stamp,
        cpid: firstStamp.cpid,
      }));
    }
  }, [stamps.data]);

  // Progressive fee estimation effect
  useEffect(() => {
    // This useEffect is no longer needed as the fee estimation is handled by useTransactionConstructionService
    // However, we keep it to ensure the formState.fee is updated correctly if the user changes it.
    // The useTransactionConstructionService will re-trigger this effect if feeRate changes.
  }, [formState.fee]);

  // Reset loading state when selected stamp changes
  useEffect(() => {
    console.log(
      "[SendTool] Effect triggered by selectedStamp?.tx_hash change. New tx_hash:",
      selectedStamp?.tx_hash,
    );
    if (selectedStamp) {
      console.log(
        "[SendTool] Effect: selectedStamp is present. Setting isImageLoading=true, showFallbackIcon=false.",
      );
      setIsImageLoading(true);
      setShowFallbackIcon(false);
      setMaxQuantity(selectedStamp.unbound_quantity);
    } else {
      console.log(
        "[SendTool] Effect: selectedStamp is null/undefined. Setting loader/fallback for empty state.",
      );
      setIsImageLoading(false); // No image to load
      setShowFallbackIcon(true); // Show placeholder for no selection
    }
  }, [selectedStamp?.tx_hash]); // Depend on tx_hash (or a unique ID) instead of the whole object

  // Add at the top level of the component
  useEffect(() => {
    console.log("Values updated:", {
      recipientAddress: formState.recipientAddress,
      stamp: selectedStamp?.stamp,
      quantity: quantity,
    });
  }, [formState.recipientAddress, selectedStamp?.stamp, quantity]);

  /* ===== EVENT HANDLERS ===== */
  const handleStampSelect = (value: string) => {
    const selectedItem = stamps.data.find(
      (item) => item?.stamp?.toString() === value,
    );

    if (selectedItem) {
      console.log(
        "[SendTool] handleStampSelect: New item selected from dropdown",
        {
          stamp_id: selectedItem.stamp,
          tx_hash: selectedItem.tx_hash,
          currentIsImageLoadingState: isImageLoading,
          currentShowFallbackState: showFallbackIcon,
        },
      );

      // Set loading to true FIRST to ensure UI shows loader before src changes
      setIsImageLoading(true);
      setShowFallbackIcon(false);
      setSelectedStamp({ ...selectedItem });

      setFormState((prev) => ({
        ...prev,
        stampId: selectedItem.stamp,
        cpid: selectedItem.cpid,
      }));
    }
  };

  const handleQuantityChange = (e: Event) => {
    e.preventDefault(); // Prevent form submission

    const input = e.target as HTMLInputElement;
    if (!input.value || input.value === "0") {
      input.value = "1";
    }
    setQuantity(parseInt(input.value));
  };

  const handleTransferSubmit = async () => {
    console.log("SENDTOOL: handleTransferSubmit Fired!");
    try {
      console.log("SENDTOOL: Starting send submit", {
        selectedStamp,
        formState,
        quantity,
      });

      await handleSubmit(async () => {
        console.log("SENDTOOL: handleSubmit's actualSubmitCallback Fired!");
        if (!selectedStamp) {
          console.error("SENDTOOL: Send failed - no stamp selected");
          throw new Error("Please select a stamp to send.");
        }
        if (!wallet?.address) {
          console.error("SENDTOOL: Send failed - no wallet connected");
          throw new Error("No wallet connected.");
        }
        if (
          !formState.recipientAddress ||
          typeof formState.recipientAddress !== "string" ||
          !formState.recipientAddress.trim()
        ) {
          console.error(
            "SENDTOOL: Invalid or empty formState.recipientAddress",
            formState.recipientAddress,
          );
          throw new Error(
            "Recipient address is required and must be a valid string.",
          );
        }
        console.log(
          "SENDTOOL: Value of formState.recipientAddress BEFORE creating requestBody:",
          formState.recipientAddress,
        );
        if (!quantity || quantity <= 0) {
          console.error("SENDTOOL: Send failed - invalid quantity", {
            quantity,
          });
          throw new Error("Invalid quantity specified.");
        }

        const feeRateKB = formState.fee * 1000; // Assuming formState.fee is in sat/vB

        const requestBody = {
          address: wallet.address,
          destination: formState.recipientAddress,
          asset: selectedStamp.cpid,
          quantity: quantity,
          satsPerVB: formState.fee,
          options: {
            return_psbt: true,
            fee_per_kb: feeRateKB,
            allow_unconfirmed_inputs: true, // Or your preferred setting
            // Add other necessary options based on CounterpartyApiManager.composeSend or similar
          },
        };

        console.log(
          "SENDTOOL: Preparing stamp send request (SendTool)",
          {
            satsPerVB_being_sent: formState.fee,
            requestBody_being_sent: requestBody,
            endpoint: "/api/v2/create/send",
          },
        );
        console.log(
          "SENDTOOL: About to fetch /api/v2/create/send. Body (stringified):",
          JSON.stringify(requestBody),
        );

        const response = await fetch("/api/v2/create/send", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(requestBody),
        });
        console.log(
          "SENDTOOL: Response received from /api/v2/create/send. Status:",
          response.status,
        );

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({
            error: "Failed to parse error from server on non-ok response",
          }));
          console.error("SENDTOOL: Error from /api/v2/create/send", {
            status: response.status,
            errorData,
          });
          throw new Error(errorData.error || "API call failed");
        }
        const responseData = await response.json();
        console.log("SENDTOOL: Response JSON parsed:", responseData);

        if (!responseData?.psbtHex || !responseData?.inputsToSign) {
          console.error(
            "SENDTOOL: Invalid response structure from /api/v2/create/send",
            { responseData },
          );
          throw new Error(
            "Invalid response from server: Missing psbtHex or inputsToSign.",
          );
        }

        console.log("SENDTOOL: About to call walletContext.signPSBT", {
          psbtHex: responseData.psbtHex,
          inputsToSign: responseData.inputsToSign,
        });
        const signResult = await walletContext.signPSBT(
          wallet,
          responseData.psbtHex,
          responseData.inputsToSign,
          true,
        );
        console.log("SENDTOOL: signPSBT result:", signResult);

        if (signResult.signed && signResult.txid) {
          console.log(
            "SENDTOOL: Send successful! TXID:",
            signResult.txid,
          );
          setSuccessMessage(`Send successful! TXID: ${signResult.txid}`);
        } else if (signResult.cancelled) {
          console.warn(
            "SENDTOOL: Stamp send signing was cancelled by user",
          );
          throw new Error("Transaction signing was cancelled.");
        } else {
          console.error(
            "SENDTOOL: Failed to sign PSBT for stamp send",
            { error: signResult.error },
          );
          throw new Error(`Failed to sign transaction: ${signResult.error}`);
        }
      });
    } catch (error) {
      console.error(
        "SENDTOOL: Error in handleTransferSubmit outer scope:",
        error,
      );
      const errorMessage = error instanceof Error
        ? error.message
        : String(error);
      setError(errorMessage);
    }
  };

  /* ===== MEMOIZED VALUES ===== */
  const stampOptions = useMemo(() => {
    return (stamps.data ?? []).map((stamp) => ({
      value: stamp.stamp?.toString() ?? "",
      label: `Stamp ${stamp.stamp}${stamp.ident ? ` - ${stamp.ident}` : ""}`,
      disabled: false,
    }));
  }, [stamps.data]);

  /* ===== RENDER HELPERS ===== */
  const renderStampContent = () => {
    if (!selectedStamp) {
      return (
        <Icon
          type="icon"
          name="uploadImage"
          weight="normal"
          size="xxl"
          color="grey"
        />
      );
    }

    // Use a stable timestamp based on selectedStamp to prevent infinite re-renders
    const stampUrl = `/s/${selectedStamp.tx_hash}`;

    console.log("Rendering stamp (renderStampContent call):", {
      stamp_id: selectedStamp.stamp,
      tx_hash: selectedStamp.tx_hash,
      url: stampUrl,
      isImageLoadingState: isImageLoading,
      showFallbackIconState: showFallbackIcon,
    });

    return (
      <div class="relative w-full h-full">
        {/* <div class="relative w-full h-full flex items-center justify-center bg-stamp-grey rounded"> */}
        {/* Image - always rendered, visibility controlled by class */}
        <img
          key={`stamp-${selectedStamp.tx_hash}`}
          src={stampUrl}
          alt={`Stamp #${selectedStamp.stamp}`}
          class={`w-full h-full object-contain pixelart transition-opacity duration-300 ${
            (isImageLoading || showFallbackIcon) ? "opacity-0" : "opacity-100"
          }`}
          onLoad={() => {
            console.log("[SendTool] Image loaded successfully:", stampUrl);
            setIsImageLoading(false);
            setShowFallbackIcon(false);
          }}
          onError={(_e) => {
            console.error("[SendTool] Image failed to load:", stampUrl, _e);
            setIsImageLoading(false);
            setShowFallbackIcon(true);
          }}
        />

        {/* Loader - shown when isImageLoading is true */}
        {isImageLoading && (
          <div class="absolute inset-0 flex items-center justify-center">
            <div class={loaderSpinGrey} />
          </div>
        )}

        {/* Fallback Icon - shown if !isImageLoading and showFallbackIcon is true */}
        {!isImageLoading && showFallbackIcon && (
          <div class="absolute inset-0 flex items-center justify-center w-full h-full">
            <Icon
              type="icon"
              name="image"
              weight="normal"
              size="xxl"
              color="grey"
            />
          </div>
        )}
      </div>
    );
  };

  /* ===== RENDER ===== */
  return (
    <div class={bodyTool}>
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>SEND</h1>

      {/* ===== STAMP SELECTION SECTION ===== */}
      <form
        class={`${containerBackground} mb-6 relative`}
        onSubmit={(e) => {
          e.preventDefault();
          // If we want the form submit to also try, but FeeCalc is primary:
          // console.log("FORM SUBMIT (SendTool): onSubmit triggered!");
          // handleTransferSubmit();
        }}
        aria-label="Send stamp"
        novalidate
      >
        {/* Progressive Fee Status Indicator removed - using simplified approach */}
        <div class={`${containerRowForm} mb-5`}>
          <div class={imagePreviewTool}>
            {renderStampContent()}
          </div>

          <div class={containerColForm}>
            <SelectField
              options={stampOptions}
              onChange={handleStampSelect}
              value={selectedStamp?.stamp?.toString() ?? ""}
            />

            <div class="flex w-full justify-end items-center gap-5">
              <div class="flex flex-col justify-start -space-y-0.5">
                <h5 class="text-xl font-bold text-stamp-grey">
                  EDITIONS
                </h5>
                <h6 class="text-sm font-medium text-stamp-grey-darker">
                  MAX {maxQuantity}
                </h6>
              </div>
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                class={inputFieldSquare}
                aria-label="Number of editions to send"
              />
            </div>
          </div>
        </div>
        <div class={rowForm}>
          <input
            value={formState.recipientAddress}
            onInput={(e: JSX.TargetedEvent<HTMLInputElement>) => {
              const newValue = e.currentTarget.value;
              console.log(
                "SENDTOOL: Recipient Address Input onInput. New value:",
                newValue,
              );
              setFormState((prev) => ({
                ...prev,
                recipientAddress: newValue,
              }));
            }}
            placeholder="Recipient address"
            class={inputField}
            aria-label="Recipient address"
          />
        </div>
      </form>

      {/* ===== FEE CALCULATOR SECTION ===== */}
      <div class={containerBackground}>
        <FeeCalculatorBase
          fee={formState.fee}
          handleChangeFee={internalHandleChangeFee}
          type="transfer"
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={() => {
            console.log(
              "FEE_CALCULATOR_SUBMIT (SendTool): onSubmit triggered!",
            );
            handleSendWithExactFees();
          }}
          buttonName={wallet?.address ? "SEND" : "CONNECT WALLET"}
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          fromPage="stamp_transfer"
          bitname=""
          stampTransferDetails={{
            address: formState.recipientAddress || "",
            stamp: selectedStamp?.stamp?.toString() || "",
            editions: quantity || 0,
          }}
          feeDetails={(exactFeeDetails || progressiveFeeDetails)
            ? {
              minerFee: (exactFeeDetails || progressiveFeeDetails)?.minerFee ||
                0,
              dustValue: 0, // Send transactions use OP_RETURN encoding, no dust outputs created
              totalValue:
                (exactFeeDetails || progressiveFeeDetails)?.totalValue || 0,
              hasExactFees:
                (exactFeeDetails || progressiveFeeDetails)?.hasExactFees ||
                false,
              estimatedSize: 300, // Default transaction size for stamp sends
            }
            : {
              minerFee: 0,
              dustValue: 0, // Send transactions use OP_RETURN encoding, no dust outputs created
              totalValue: 0,
              hasExactFees: false,
              estimatedSize: 300,
            }}
          // Progressive fee estimation status props removed - using simplified approach
        />

        {/* 🚀 Three-Phase Fee Estimation Status Indicator */}
        <div className="absolute top-3 right-3 z-10">
          {/* Phase 2: Smart UTXO-based estimation (background pre-fetching) */}
          {isPreFetching && (
            <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10 mb-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse">
                </div>
                <div className="absolute inset-0 w-1.5 h-1.5 bg-blue-400 rounded-full animate-ping opacity-20">
                </div>
              </div>
              <span className="hidden sm:inline text-xs text-stamp-grey-light font-normal opacity-80">
                Smart UTXO analysis
              </span>
              <span className="inline sm:hidden text-blue-400 text-xs opacity-80">
                💡
              </span>
            </div>
          )}

          {/* Phase 3: Exact estimation (during sending) */}
          {isSubmitting && currentPhase === "exact" && (
            <div className="flex items-center gap-2 bg-green-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-green-500/20 mb-2">
              <div className="relative">
                <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse">
                </div>
                <div className="absolute inset-0 w-1.5 h-1.5 bg-green-400 rounded-full animate-ping opacity-20">
                </div>
              </div>
              <span className="hidden sm:inline text-xs text-green-300 font-normal opacity-90">
                Exact fee calculation
              </span>
              <span className="inline sm:hidden text-green-400 text-xs opacity-80">
                🎯
              </span>
            </div>
          )}

          {/* Phase Status Summary - Always visible when connected */}
          {wallet?.address && !isSubmitting && (
            <div className="flex items-center gap-2 bg-stamp-grey-darker/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-stamp-grey-light/10">
              {/* Phase indicators */}
              <div className="flex items-center gap-1">
                {/* Phase 1: Instant */}
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    phase1 ? "bg-green-400" : "bg-stamp-grey-light/30"
                  }`}
                  title="Phase 1: Instant estimate"
                >
                </div>

                {/* Phase 2: Smart */}
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    phase2
                      ? "bg-blue-400"
                      : currentPhase === "smart" || isPreFetching
                      ? "bg-blue-400 animate-pulse"
                      : "bg-stamp-grey-light/30"
                  }`}
                  title="Phase 2: Smart UTXO estimate"
                >
                </div>

                {/* Phase 3: Exact */}
                <div
                  className={`w-1.5 h-1.5 rounded-full ${
                    phase3 ? "bg-green-500" : "bg-stamp-grey-light/30"
                  }`}
                  title="Phase 3: Exact calculation"
                >
                </div>
              </div>

              {/* Current phase text */}
              <span className="hidden sm:inline text-xs text-stamp-grey-light font-normal opacity-80">
                {currentPhase === "instant" && "⚡ Instant"}
                {currentPhase === "smart" && "💡 Smart"}
                {currentPhase === "exact" && "🎯 Exact"}
              </span>

              {/* Mobile-only emoji */}
              <span className="inline sm:hidden text-stamp-grey-light text-xs opacity-80">
                {currentPhase === "instant" && "⚡"}
                {currentPhase === "smart" && "💡"}
                {currentPhase === "exact" && "🎯"}
              </span>
            </div>
          )}

          {/* Error indicator */}
          {feeEstimationError && (
            <div className="flex items-center gap-2 bg-red-900/95 backdrop-blur-sm rounded-full px-3 py-1.5 shadow-sm border border-red-500/20 mt-2">
              <div className="w-1.5 h-1.5 bg-red-400 rounded-full"></div>
              <span className="hidden sm:inline text-xs text-red-300 font-normal opacity-90">
                Estimation error
              </span>
              <span className="inline sm:hidden text-red-400 text-xs opacity-80">
                ⚠️
              </span>
              <button
                type="button"
                onClick={clearError}
                className="text-red-300 hover:text-red-200 text-xs ml-1"
                title="Clear error"
              >
                ×
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ===== STATUS MESSAGES ===== */}
      {error && (
        <div class="text-red-500 text-center mt-4 font-medium">
          {error}
        </div>
      )}
      {successMessage && (
        <div class="text-green-500 text-center mt-4 font-medium">
          {successMessage}
        </div>
      )}
    </div>
  );
}
