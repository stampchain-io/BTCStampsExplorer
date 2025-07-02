/* ===== BUY STAMP MODAL COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import type { StampRow } from "$globals";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { logger } from "$lib/utils/logger.ts";
import { walletContext } from "$client/wallet/wallet.ts";
import { ModalBase } from "$layout";
import { stackConnectWalletModal } from "$islands/layout/ModalStack.tsx";
import { handleModalClose } from "$components/layout/ModalBase.tsx";
import { closeModal, openModal } from "$islands/modal/states.ts";
import { StampImage } from "$content";
import { inputFieldSquare } from "$form";
import { FeeCalculatorSimple } from "$components/section/FeeCalculatorSimple.tsx";
import { showToast } from "$lib/utils/toastSignal.ts";

/* ===== TYPES ===== */
interface Props {
  stamp: StampRow;
  fee: number;
  handleChangeFee: (fee: number) => void;
  dispenser: any;
}

/* ===== COMPONENT ===== */
const BuyStampModal = ({
  stamp,
  fee: initialFee,
  handleChangeFee,
  dispenser,
}: Props) => {
  /* ===== CONTEXT ===== */
  const { wallet } = walletContext;

  /* ===== STATE ===== */
  const [tosAgreed, setTosAgreed] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [maxQuantity, setMaxQuantity] = useState(1);
  const [_pricePerUnit, setPricePerUnit] = useState(0);
  const [totalPrice, setTotalPrice] = useState(0);

  /* ===== COMPUTED VALUES ===== */
  const displayPrice = dispenser
    ? parseInt(dispenser.satoshirate.toString(), 10) / 100000000
    : (typeof stamp.floorPrice === "number" ? stamp.floorPrice : 0);

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

  /* ===== EFFECTS ===== */
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  useEffect(() => {
    if (dispenser) {
      const maxQty = Math.floor(
        dispenser.give_remaining / dispenser.give_quantity,
      );
      setMaxQuantity(maxQty);
      setPricePerUnit(dispenser.satoshirate);
      setTotalPrice(quantity * dispenser.satoshirate);
    }
  }, [dispenser, quantity]);

  useEffect(() => {
    logger.debug("ui", {
      message: "BuyStampModal mounted",
      component: "BuyStampModal",
    });
    return () => {
      logger.debug("ui", {
        message: "BuyStampModal unmounting",
        component: "BuyStampModal",
      });
    };
  }, []);

  useEffect(() => {
    if (formHookError) {
      showToast(formHookError, "error", false);
      setFormHookError(null);
    }
  }, [formHookError, setFormHookError]);

  /* ===== EVENT HANDLERS ===== */
  const handleQuantityChange = (e: Event) => {
    const value = parseInt((e.target as HTMLInputElement).value, 10);
    if (value > maxQuantity) {
      setQuantity(maxQuantity);
    } else if (value < 1 || isNaN(value)) {
      setQuantity(1);
    } else {
      setQuantity(value);
    }
  };

  /* ===== TRANSACTION HANDLING ===== */
  const handleBuyClick = async () => {
    if (!wallet || !wallet.address) {
      const { modalContent } = stackConnectWalletModal(() => {
        openModal(
          <BuyStampModal
            stamp={stamp}
            fee={initialFee}
            handleChangeFee={handleChangeFee}
            dispenser={dispenser}
          />,
          "scaleUpDown",
        );
      });
      openModal(modalContent, "scaleUpDown");
      return;
    }

    await handleSubmit(async () => {
      const feeRateKB = formState.fee * 1000;
      const options = { return_psbt: true, fee_per_kb: feeRateKB };

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
      } else if (signResult.cancelled) {
        showToast("Transaction signing was cancelled.", "info", true);
      } else {
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
      }
    });
  };

  /* ===== RENDER ===== */
  return (
    <ModalBase
      onClose={() => {
        logger.debug("ui", {
          message: "Modal closing",
          component: "BuyStampModal",
        });
        closeModal();
      }}
      title="BUY"
    >
      {/* ===== STAMP DETAILS SECTION ===== */}
      <div className="flex flex-row gap-6">
        <div className="flex flex-col w-[156px] mobileLg:w-[164px]">
          <StampImage
            stamp={stamp}
            className=""
            flag={false}
          />
        </div>
        <div className="flex flex-col w-full">
          <h5 className="font-extrabold text-3xl gray-gradient1">
            <span className="font-light text-stamp-grey-light">
              #
            </span>
            {stamp.stamp}
          </h5>

          {/* ===== QUANTITY SELECTION ===== */}
          <div className="flex flex-row pt-3 w-full justify-between items-center">
            <div className="flex flex-col items-start -space-y-0.5">
              <h5 className="font-bold text-lg text-stamp-grey">
                EDITIONS
              </h5>
              <h6 className="font-medium text-sm text-stamp-grey-darker">
                MAX {maxQuantity}
              </h6>
            </div>
            <div className="flex flex-col items-end">
              <input
                type="number"
                min="1"
                max={maxQuantity}
                value={quantity}
                onChange={handleQuantityChange}
                className={inputFieldSquare}
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== FEE CALCULATOR ===== */}
      <FeeCalculatorSimple
        fee={formState.fee}
        handleChangeFee={(newFee) => {
          logger.debug("ui", {
            message: "Fee changing",
            newFee,
            component: "BuyStampModal",
          });
          internalHandleChangeFee(newFee);
        }}
        type="buy"
        tosAgreed={tosAgreed}
        onTosChange={setTosAgreed}
        amount={totalPrice}
        price={displayPrice}
        edition={quantity}
        fromPage="stamp_buy"
        BTCPrice={formState.BTCPrice}
        isSubmitting={isSubmitting}
        onSubmit={() => {
          logger.debug("ui", {
            message: "Submit clicked",
            component: "BuyStampModal",
          });
          handleBuyClick();
        }}
        onCancel={() => {
          handleModalClose();
        }}
        buttonName="BUY"
        className="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address ?? ""}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
      />
    </ModalBase>
  );
};

export default BuyStampModal;
