/* ===== FAIRMINT CONTENT COMPONENT ===== */
import { useFairmintForm } from "$client/hooks/useFairmintForm.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { bodyTool, containerBackground, containerColForm } from "$layout";
import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";
import { StatusMessages } from "$notification";
import { FeeCalculatorBase } from "$section";
import { titlePurpleLD } from "$text";
import { useState } from "preact/hooks";
import {
  ANIMATION_TIMINGS,
  EASING_FUNCTIONS,
} from "$lib/components/fee-indicators/AnimationConstants.ts";
import {
  FEE_INDICATOR_COLORS,
  FEE_INDICATOR_SPACING,
} from "$lib/components/fee-indicators/StyleConstants.ts";
import { FairmintToolStyles } from "./FairmintToolStyles.tsx";

/* ===== TYPES ===== */
interface FairmintToolProps {
  fairminters: any[];
}

/* ===== COMPONENT ===== */
export function FairmintTool({ fairminters }: FairmintToolProps) {
  /* ===== STATE ===== */
  const {
    formState,
    handleAssetChange,
    handleInputChange,
    handleSubmit,
    handleChangeFee,
    isLoading,
    isSubmitting,
    submissionMessage,
    apiError,
  } = useFairmintForm(fairminters);

  const [tosAgreed, setTosAgreed] = useState(false);
  const { wallet } = walletContext;

  /* ===== PROGRESSIVE FEE ESTIMATION ===== */
  const {
    feeDetails: progressiveFeeDetails,
    currentPhase,
    phase1Result,
    phase2Result,
    phase3Result,
    isPreFetching,
    isEstimating,
  } = useTransactionFeeEstimator({
    toolType: "stamp", // Fairmint uses stamp toolType for minting
    feeRate: isSubmitting ? 0 : formState.fee,
    ...(wallet?.address && { walletAddress: wallet.address }),
    isConnected: !!wallet && !isSubmitting,
    isSubmitting,
    // Fairmint specific parameters - using defaults
    fileType: "application/json", // Fairmint uses JSON
    fileSize: formState.jsonSize || 0,
    issuance: parseInt(formState.quantity, 10) || 1,
  });

  /* ===== HELPERS ===== */
  // Check if the fairminters array is empty
  const hasFairminters = fairminters && fairminters.length > 0;

  /* ===== RENDER ===== */
  if (isLoading) {
    return <div>Loading...</div>;
  }

  return (
    <div class={bodyTool} data-testid="fairmint-tool">
      <FairmintToolStyles />
      <h1 class={`${titlePurpleLD} mobileMd:mx-auto mb-1`}>FAIRMINT</h1>

      <form class={`${containerBackground} mb-6`}>
        {/* ===== TOKEN SELECTION ===== */}
        <div class={containerColForm}>
          {hasFairminters
            ? (
              // Render the select dropdown if fairminters are available
              <select
                class="h-10 p-3 rounded-md bg-[#999999] text-black placeholder:text-black placeholder:font-light"
                value={formState.asset}
                onChange={handleAssetChange}
              >
                <option value="">SELECT A TOKEN</option>
                {fairminters
                  .filter(
                    (fairminter) =>
                      fairminter.asset && fairminter.status === "open",
                  )
                  .map((fairminter) => {
                    const asset = fairminter.asset;
                    const displayName = asset.startsWith("A")
                      ? fairminter.asset_longname || asset
                      : asset;
                    return (
                      <option value={asset} key={asset}>
                        {displayName}
                      </option>
                    );
                  })}
              </select>
            )
            : (
              // Render an input field if no fairminters are available
              <input
                type="text"
                placeholder="ENTER ASSET"
                class="h-10 p-3 rounded-md bg-[#999999] text-black placeholder:text-black placeholder:font-light"
                value={formState.asset}
                onChange={(e) => handleInputChange(e, "asset")}
              />
            )}

          <input
            type="number"
            placeholder="QUANTITY"
            class="h-10 p-3 rounded-md bg-[#999999] text-black placeholder:text-black placeholder:font-light"
            value={formState.quantity}
            onChange={(e) => handleInputChange(e, "quantity")}
          />
        </div>
      </form>

      {/* ===== FEE CALCULATOR ===== */}
      <div class={containerBackground} data-testid="fee-calculator">
        {/* ===== PHASE INDICATOR ===== */}
        {currentPhase && wallet && !isSubmitting && (
          <div
            data-phase={currentPhase}
            data-testid="fee-phase-indicator"
            class="flex items-center gap-2 mb-3"
            style={{
              transitionDuration: ANIMATION_TIMINGS.normal,
              transitionTimingFunction: EASING_FUNCTIONS.easeInOut,
            }}
          >
            {/* Phase dots */}
            <div class="flex items-center gap-1">
              <div
                class={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  phase1Result ? "opacity-100" : "opacity-30"
                }`}
                style={{
                  backgroundColor: phase1Result
                    ? FEE_INDICATOR_COLORS.instant
                    : FEE_INDICATOR_COLORS.loading,
                }}
                title="Phase 1: Instant estimate"
              />
              <div
                class={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  phase2Result ? "opacity-100" : "opacity-30"
                } ${isPreFetching ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor: phase2Result
                    ? FEE_INDICATOR_COLORS.cached
                    : FEE_INDICATOR_COLORS.loading,
                }}
                title="Phase 2: Smart UTXO estimate"
              />
              <div
                class={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                  phase3Result ? "opacity-100" : "opacity-30"
                } ${isEstimating ? "animate-pulse" : ""}`}
                style={{
                  backgroundColor: phase3Result
                    ? FEE_INDICATOR_COLORS.exact
                    : FEE_INDICATOR_COLORS.loading,
                }}
                title="Phase 3: Exact calculation"
              />
            </div>

            {/* Phase text */}
            <span class="text-xs text-stamp-grey-light font-normal opacity-80">
              {currentPhase === "instant" && "⚡ Instant"}
              {currentPhase === "cached" && "💡 Smart"}
              {currentPhase === "exact" && "🎯 Exact"}
            </span>
          </div>
        )}

        <FeeCalculatorBase
          fee={formState.fee}
          handleChangeFee={handleChangeFee}
          type="fairmint"
          fileType="application/json"
          fileSize={formState.jsonSize}
          BTCPrice={formState.BTCPrice}
          isSubmitting={isSubmitting}
          onSubmit={handleSubmit}
          buttonName="FAIRMINT"
          tosAgreed={tosAgreed}
          onTosChange={setTosAgreed}
          feeDetails={mapProgressiveFeeDetails(progressiveFeeDetails) || {
            minerFee: 0,
            dustValue: 0,
            totalValue: 0,
            hasExactFees: false,
            estimatedSize: 300,
          }}
          bitname=""
          // Pass progressive fee props for FeeCalculatorBase
          phase1Result={phase1Result}
          phase2Result={phase2Result}
          phase3Result={phase3Result}
          currentPhase={currentPhase}
          isPreFetching={isPreFetching}
          isEstimating={isEstimating}
        />

        {/* ===== STATUS MESSAGES ===== */}
        <StatusMessages
          submissionMessage={submissionMessage}
          apiError={apiError}
        />
      </div>
    </div>
  );
}
