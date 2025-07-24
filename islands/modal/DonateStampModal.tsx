/* ===== DONATE STAMP MODAL COMPONENT ===== */
import { sliderBar, sliderKnob } from "$button";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { ProgressiveFeeStatusIndicator } from "$components/fee/index.ts";
import { handleModalClose } from "$components/layout/ModalBase.tsx";
import { StampImage } from "$content";
import type { StampRow } from "$globals";
import { stackConnectWalletModal } from "$islands/layout/ModalStack.tsx";
import { closeModal, openModal } from "$islands/modal/states.ts";
import { ModalBase } from "$layout";
import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator.ts";
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";
import { logger } from "$lib/utils/logger.ts";
import { showToast } from "$lib/utils/toastSignal.ts";
import { tooltipImage } from "$notification";
import { FeeCalculatorBase } from "$section";
import { useEffect, useRef, useState } from "preact/hooks";

/* ===== TYPES ===== */
interface Props {
  stamp: StampRow;
  fee: number;
  handleChangeFee: (fee: number) => void;
  dispenser: any;
}

/* ===== COMPONENT ===== */
const DonateStampModal = ({
  stamp,
  fee: initialFee,
  handleChangeFee,
  dispenser,
}: Props) => {
  /* ===== CONTEXT ===== */
  const { wallet } = walletContext;

  /* ===== STATE ===== */
  const [quantity, setQuantity] = useState(1);
  // const [maxQuantity, setMaxQuantity] = useState(1);
  const [totalPrice, setTotalPrice] = useState(0);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const [isAmountTooltipVisible, setIsAmountTooltipVisible] = useState(false);
  const [tosAgreed, setTosAgreed] = useState(false);

  /* ===== REFS ===== */
  const amountTooltipTimeoutRef = useRef<number | null>(null);

  /* ===== FORM HANDLING ===== */
  const {
    formState,
    handleChangeFee: internalHandleChangeFee,
    handleSubmit,
    isSubmitting,
    error: formHookError,
    setError: setFormHookError,
  } = useTransactionForm({
    type: "buy",
    initialFee,
  });

  /* ===== 🚀 PROGRESSIVE FEE ESTIMATION INTEGRATION ===== */
  const {
    feeDetails: progressiveFeeDetails,
    isPreFetching,
    error: feeEstimationError,
    clearError,
    // Phase-specific results for status indicator
    currentPhase,
    phase1Result,
    phase2Result,
    phase3Result,
  } = useTransactionFeeEstimator({
    toolType: "stamp", // Donate uses stamp toolType for dispense transactions
    feeRate: isSubmitting ? 0 : formState.fee,
    ...(wallet?.address && { walletAddress: wallet.address }),
    isConnected: !!wallet && !isSubmitting,
    isSubmitting,
    // Donation-specific parameters
    ...(dispenser && {
      dispenserSource: dispenser.source,
      purchaseQuantity: totalPrice.toString(),
    }),
  });

  /* ===== EFFECTS ===== */
  // Sync fee state with parent
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  // Update total price when dispenser or quantity changes
  useEffect(() => {
    if (dispenser) {
      // const maxQty = Math.floor(
      //   dispenser.give_remaining / dispenser.give_quantity,
      // );
      // setMaxQuantity(maxQty);
      setTotalPrice(quantity * dispenser.satoshirate);
    }
  }, [dispenser, quantity]);

  // Cleanup tooltip timeout
  useEffect(() => {
    return () => {
      if (amountTooltipTimeoutRef.current) {
        globalThis.clearTimeout(amountTooltipTimeoutRef.current);
      }
    };
  }, []);

  // Debug logging
  useEffect(() => {
    logger.debug("ui", {
      message: "DonateStampModal mounted",
      component: "DonateStampModal",
    });

    return () => {
      logger.debug("ui", {
        message: "DonateStampModal unmounting",
        component: "DonateStampModal",
      });
    };
  }, []);

  // Handle form errors with toast notifications
  useEffect(() => {
    if (formHookError) {
      showToast(formHookError, "error", false);
      setFormHookError(null);
    }
  }, [formHookError, setFormHookError]);

  // Handle fee estimation errors
  useEffect(() => {
    if (feeEstimationError) {
      logger.debug("system", {
        message: "Fee estimation error in DonateStampModal",
        error: feeEstimationError,
      });
    }
  }, [feeEstimationError]);

  /* ===== EVENT HANDLERS ===== */
  const handleMouseMove = (e: MouseEvent) => {
    setTooltipPosition({
      x: e.clientX,
      y: e.clientY,
    });
  };

  const handleAmountMouseEnter = () => {
    if (amountTooltipTimeoutRef.current) {
      globalThis.clearTimeout(amountTooltipTimeoutRef.current);
    }

    amountTooltipTimeoutRef.current = globalThis.setTimeout(() => {
      setIsAmountTooltipVisible(true);
    }, 1500);
  };

  const handleAmountMouseLeave = () => {
    if (amountTooltipTimeoutRef.current) {
      globalThis.clearTimeout(amountTooltipTimeoutRef.current);
    }
    setIsAmountTooltipVisible(false);
  };

  const handleMouseDown = () => {
    if (amountTooltipTimeoutRef.current) {
      globalThis.clearTimeout(amountTooltipTimeoutRef.current);
    }
    setIsAmountTooltipVisible(false);
  };

  /* ===== TRANSACTION HANDLING ===== */
  const handleBuyClick = async () => {
    // Check if wallet is connected first
    if (!wallet || !wallet.address) {
      const { modalContent } = stackConnectWalletModal(() => {
        // Open the Donate Stamp Modal
        openModal(
          <DonateStampModal
            stamp={stamp}
            fee={initialFee}
            handleChangeFee={handleChangeFee}
            dispenser={dispenser}
          />,
          "slideUpDown",
        );
      });

      // Open the Connect Wallet Modal
      openModal(modalContent, "slideUpDown");
      return;
    }

    await handleSubmit(async () => {
      // Convert fee rate from sat/vB to sat/kB
      const feeRateKB = formState.fee * 1000;

      const options = {
        return_psbt: true,
        fee_per_kb: feeRateKB,
      };

      const response = await fetch("/api/v2/create/dispense", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          address: wallet.address,
          dispenser: dispenser.source,
          quantity: totalPrice,
          options,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: "Failed to parse error from server.",
        }));
        const detailedError = errorData.error ||
          "Failed to create dispense transaction (unknown server error).";
        logger.error("ui", {
          message: "API error creating dispense transaction",
          details: detailedError,
          status: response.status,
        });
        throw new Error("Failed to prepare transaction. Please try again.");
      }

      const responseData = await response.json();
      if (!responseData?.psbt || !responseData?.inputsToSign) {
        logger.error("ui", {
          message: "Invalid API response: Missing PSBT or inputsToSign",
          data: responseData,
        });
        throw new Error("Received invalid transaction data from server.");
      }

      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.psbt,
        responseData.inputsToSign,
        true, // Enable RBF
      );

      if (signResult.signed) {
        if (signResult.txid) {
          showToast(
            `Broadcasted: ${signResult.txid.substring(0, 10)}...`,
            "success",
            false,
          );
          closeModal();
        } else if (signResult.psbt) {
          try {
            showToast("Transaction signed. Broadcasting...", "info", true);
            const broadcastTxid = await walletContext.broadcastPSBT(
              signResult.psbt,
            );
            if (broadcastTxid && typeof broadcastTxid === "string") {
              showToast(
                ` Broadcasted: ${broadcastTxid.substring(0, 10)}...`,
                "success",
                false,
              );
              closeModal();
            } else {
              logger.error("ui", {
                message: "Broadcast did not return a valid TXID after signing",
                broadcastResult: broadcastTxid,
                psbtHex: signResult.psbt,
              });
              throw new Error(
                "Broadcast failed after signing. Please check transaction status.",
              );
            }
          } catch (broadcastError: unknown) {
            const beMsg = broadcastError instanceof Error
              ? broadcastError.message
              : String(broadcastError);
            logger.error("ui", {
              message: "Error broadcasting signed PSBT",
              error: beMsg,
              psbtHex: signResult.psbt,
            });
            throw new Error(
              `Broadcast failed: ${beMsg.substring(0, 50)}${
                beMsg.length > 50 ? "..." : ""
              }`,
            );
          }
        } else {
          logger.error("ui", {
            message: "Signed but no TXID or PSBT hex returned to modal",
            signResult,
          });
          throw new Error(
            "Signing reported success, but critical data missing.",
          );
        }
      } else if (!signResult.cancelled) {
        const signErrorMsg = signResult.error || "Unknown signing error";
        logger.error("ui", {
          message: "PSBT Signing failed",
          error: signErrorMsg,
          details: signResult,
        });
        throw new Error(
          `Signing failed: ${signErrorMsg.substring(0, 50)}${
            signErrorMsg.length > 50 ? "..." : ""
          }`,
        );
      } else {
        showToast("Transaction signing was cancelled.", "info", true);
      }
    });
  };

  /* ===== HELPER FUNCTIONS ===== */
  const amountToSliderPos = (amount: number) =>
    amount <= 20
      ? (amount / 20) * 66.67
      : 66.67 + ((amount - 20) / 480) * 33.33;

  const sliderPosToAmount = (pos: number) => {
    if (pos <= 66.67) {
      return Math.round((pos / 66.67) * 20); // 1-20 with 1.0 steps
    }
    const value = 20 + ((pos - 66.67) / 33.33) * 480;
    return Math.min(500, Math.round(value)); // 20-500 with 1.0 steps
  };

  /* ===== RENDER ===== */
  return (
    <ModalBase
      onClose={() => {
        logger.debug("ui", {
          message: "Modal closing",
          component: "DonateStampModal",
        });
        closeModal();
      }}
      title="DONATE"
    >
      {/* ===== PRICE DISPLAY ===== */}
      <div className="mb-6">
        <h6 className="font-extrabold text-3xl text-stamp-grey-light text-center">
          {(totalPrice / 100000000).toFixed(8)}{" "}
          <span className="font-extralight">BTC</span>
        </h6>
      </div>

      {/* ===== 🎯 PROGRESSIVE FEE STATUS INDICATOR ===== */}
      <ProgressiveFeeStatusIndicator
        isConnected={!!wallet}
        isSubmitting={isSubmitting}
        currentPhase={currentPhase}
        phase1Result={phase1Result}
        phase2Result={phase2Result}
        phase3Result={phase3Result}
        isPreFetching={isPreFetching}
        feeEstimationError={feeEstimationError}
        clearError={clearError}
      />

      {/* ===== STAMP DETAILS ===== */}
      <div className="flex flex-row gap-6">
        <div className="flex flex-col w-[156px] mobileLg:w-[164px]">
          <StampImage
            stamp={stamp}
            className=""
            flag={false}
          />
        </div>

        {/* ===== QUANTITY SELECTION ===== */}
        <div className="flex flex-col w-full">
          <div className="flex flex-col items-start pt-0.5 -space-y-0.5">
            <h6 className="font-light text-sm text-stamp-grey-darker">
              RECEIVE
            </h6>
            <h6 className="font-light text-lg text-stamp-grey-light">
              <span className="font-bold">{quantity * 1000}</span> USDSTAMPS
              {quantity * 1000 > 1 ? "" : ""}
            </h6>
          </div>

          {/* ===== AMOUNT SLIDER ===== */}
          <div className="mt-[18px]">
            <div
              className="relative w-full group"
              onMouseMove={handleMouseMove}
              onMouseEnter={handleAmountMouseEnter}
              onMouseLeave={handleAmountMouseLeave}
              onMouseDown={handleMouseDown}
              onClick={(e) => e.stopPropagation()}
            >
              <input
                type="range"
                min="1"
                max="100"
                step="0.25"
                value={amountToSliderPos(quantity)}
                onInput={(e) => {
                  const target = e.target as HTMLInputElement;
                  setQuantity(
                    Math.max(1, sliderPosToAmount(parseFloat(target.value))),
                  );
                }}
                className={`${sliderBar} ${sliderKnob}`}
              />
              <div
                className={`${tooltipImage} ${
                  isAmountTooltipVisible ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  left: `${tooltipPosition.x}px`,
                  top: `${tooltipPosition.y - 6}px`,
                  transform: "translate(-50%, -100%)",
                }}
              >
                SELECT AMOUNT
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ===== FEE CALCULATOR ===== */}
      <FeeCalculatorBase
        fee={formState.fee}
        handleChangeFee={(newFee: number) => {
          logger.debug("ui", {
            message: "Fee changing",
            newFee,
            component: "DonateStampModal",
          });
          internalHandleChangeFee(newFee);
        }}
        type="buy"
        tosAgreed={tosAgreed}
        onTosChange={setTosAgreed}
        amount={totalPrice}
        price={0} // Donation has no price
        edition={quantity * 1000} // USDSTAMPS received
        fromPage="donate"
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={() => {
          logger.debug("ui", {
            message: "Submit clicked",
            component: "DonateStampModal",
          });
          handleBuyClick();
        }}
        onCancel={() => {
          handleModalClose();
        }}
        buttonName={wallet?.address ? "DONATE" : "CONNECT WALLET"}
        className="pt-9 mobileLg:pt-12"
        bitname={undefined}
        // ===== 🚀 PROGRESSIVE FEE DETAILS INTEGRATION =====
        feeDetails={mapProgressiveFeeDetails(progressiveFeeDetails) || {
          minerFee: 0,
          dustValue: 0,
          totalValue: 0,
          hasExactFees: false,
          estimatedSize: 300,
        }}
      />
    </ModalBase>
  );
};

export default DonateStampModal;
