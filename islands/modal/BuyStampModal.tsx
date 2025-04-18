/* ===== BUY STAMP MODAL COMPONENT ===== */
import { useEffect, useState } from "preact/hooks";
import type { StampRow } from "$globals";
import { StampImage } from "$content";
import { walletContext } from "$client/wallet/wallet.ts";
import { FeeCalculatorSimple } from "$components/section/FeeCalculatorSimple.tsx";
import { ModalBase } from "$layout";
import { useTransactionForm } from "$client/hooks/useTransactionForm.ts";
import { logger } from "$lib/utils/logger.ts";
import { inputFieldSquare } from "$form";
import { closeModal, openModal } from "$islands/modal/states.ts";
import { stackConnectWalletModal } from "$islands/layout/ModalStack.tsx";

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
    error,
    successMessage,
    setSuccessMessage,
  } = useTransactionForm({
    type: "buy",
    initialFee,
  });

  /* ===== EFFECTS ===== */
  // Sync external fee state with internal state
  useEffect(() => {
    handleChangeFee(formState.fee);
  }, [formState.fee]);

  // Update quantity and price when dispenser changes
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

  // Debug logging
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
    // Check if wallet is connected first
    if (!wallet || !wallet.address) {
      const { modalContent } = stackConnectWalletModal(() => {
        // After successful connection, reopen the BuyStampModal
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

      // Open the connect modal
      openModal(modalContent, "scaleUpDown");
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
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Failed to create dispense transaction.",
        );
      }

      const responseData = await response.json();

      if (!responseData?.psbt || !responseData?.inputsToSign) {
        throw new Error("Invalid response: Missing PSBT or inputsToSign");
      }

      // PSBT is already in hex format with witness data from backend
      const signResult = await walletContext.signPSBT(
        wallet,
        responseData.psbt,
        responseData.inputsToSign,
        true, // Enable RBF
      );

      if (signResult.signed && signResult.txid) {
        setSuccessMessage(
          `Transaction broadcasted successfully. TXID: ${signResult.txid}`,
        );
        setTimeout(() => closeModal(), 5000);
      } else if (signResult.cancelled) {
        throw new Error("Transaction signing was cancelled.");
      } else {
        throw new Error(`Failed to sign PSBT: ${signResult.error}`);
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
          <h5 className="text-3xl gray-gradient1 font-extrabold">
            <span className="text-stamp-grey-light font-light">
              #
            </span>
            {stamp.stamp}
          </h5>

          {/* ===== QUANTITY SELECTION ===== */}
          <div className="flex flex-row pt-3 w-full justify-between items-center">
            <div className="flex flex-col items-start -space-y-0.5">
              <h5 className="text-lg font-bold text-stamp-grey">
                EDITIONS
              </h5>
              <h6 className="text-sm font-medium text-stamp-grey-darker">
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
          logger.debug("ui", {
            message: "Cancel clicked",
            component: "BuyStampModal",
          });
          closeModal();
        }}
        buttonName="BUY"
        className="pt-9 mobileLg:pt-12"
        userAddress={wallet?.address ?? ""}
        inputType="P2WPKH"
        outputTypes={["P2WPKH"]}
      />

      {/* ===== STATUS MESSAGES ===== */}
      {error && <div className="text-red-500 mt-2">{error}</div>}
      {successMessage && (
        <div className="text-green-500 mt-2">{successMessage}</div>
      )}
    </ModalBase>
  );
};

export default BuyStampModal;
